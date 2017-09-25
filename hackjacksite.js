/**
 * Created by Charlie Miller on 8/16/2017.
 */
// Create server instance
var server = require("webserver").create(),
    system = require('system'),
    port   = system.env.PORT || 8080;

var service = server.listen(port, function(request, response)
{
    var page = new WebPage();

    response.statusCode = 200;
    response.setHeader('Content-Type', 'text/html; charset=utf-8')

    // We want to take the data we're being given.
    if(request.method == 'POST')
    {
        // Take post data
        var receiptNumber = String(request.post["receipt"]);

        if(receiptNumber != null)
        {
            // Has to be a 14 character long digit. This shouldn't be a problem,
            // if it's being sent from the app.
            if(receiptNumber.match(/^[0-9]{14}$/))
            {
                console.log("Valid receipt: " + receiptNumber);
                // Open page
                redeem_receipt(receiptNumber, function(validCode)
                {
                    console.log("Valid Code!: " + validCode);
                    response.write(validCode);
                    response.close();
                });
            }
            else
            {
                response.write("Sorry, that's not a valid receipt")
            }
        }
        
    }
    else
    {
        response.write("Thanks for visiting the HackJack site. For more info visit: charliemiller.xyz/hackjack");
    }

    // page.close();
});

if(service)
{
    console.log("Server started at http://localhost:8080");
}

/**
 *  This is the function that's called whenever a valid receipt number is received.
 *  It's responsible for all of the webscraping and interactions.
 *
 * @param receiptNumber     A 14 digit receipt number.
 * @param callback          Callback function that we'll feed our valid redemption code to.
 */
function redeem_receipt(receiptNumber, callback)
{
    // Create page.
    var page = require('webpage').create(),
    currentPage = "",
    pageNum = 0;

    var lastTime = new Date();

    // Set virtual viewport. Don't know if this much effects anything other
    // than maybe taking snapshots?
    page.viewportSize = { width: 800, height: 1200 };

    /**
     *  We use this map to associate urls with query selection strings. By default, this map is used
     *  with the intent of retrieving the coordinates of the elements. At a later date, I might build this out
     *  so events types or functions are associated to each query selection string. But I've already written
     *  this stupid thing a couple times.
     */
    var urlQuerySelectorMap = {
        "https://www.inmoment.com/websurvey/2/execute":    ["#option_375767_172961"],
        "https://www.inmoment.com/websurvey/2/execute#/1": ["#option_375767_172961"],
        "https://www.inmoment.com/websurvey/2/execute#/3": ["#option_197653_85260"],
        "https://www.inmoment.com/websurvey/2/execute#/4": ["#option_197661_85264"],
        "https://www.inmoment.com/websurvey/2/execute#/5": [".rating"],
        "https://www.inmoment.com/websurvey/2/execute#/6": ["#option_197758_85293"],
        "https://www.inmoment.com/websurvey/2/execute#/7": ["#commentArea"],
        "https://www.inmoment.com/websurvey/2/execute#/8": ["#option_727658_331644"]
    };

    /**
     *  Callback made any time the url for the browser changes.
     *  If the url is one in our #urlQuerySelectorMap, it'll end up getting evaluated
     *  by {@see newEvaluatePage}.
     *
     * @param targetUrl     The url that the browser is navigating to.
     *                      As of right now, I just use this for diagnostics.
     */
    page.onUrlChanged = function(targetUrl)
    {
        currentPage = String(targetUrl);
        pageNum++;

        console.log("URL CHANGE: " + targetUrl);

        // setInterval(newEvaluatePage(currentPage), 500);
        setTimeout(newEvaluatePage(currentPage), 500);
    };

    /**
     *  This implemented so we can receive console logging
     *  from a function contained within an 'page.evaluate()'.
     *
     * @param msg       The msg delivered from the evaluated page's console.
     */
    page.onConsoleMessage = function(msg) {
      console.log(msg);
    };

    /**
     * @param url
     */
    function newEvaluatePage(url)
    {
        // Retrieve the current date/time
        time = new Date();

        // We'll avoid any page interactions if we just made an attempt 50ms ago.
        if((time.getTime() - lastTime.getTime()) > 50)
        {
            lastTime = time;

            console.log("Evaluating url: " + url);

            // Unfortunately, there are some particular evaluations/
            // processes that need to be carried out for particular pages. We check
            // these cases first.
            switch(url)
            {
                // Depending on a couple of scenarios, one of these urls will
                // end up giving us the receipt code that we're after.
                case "https://www.inmoment.com/websurvey/2/execute#/6":
                case "https://www.inmoment.com/websurvey/2/execute#/13":

                    var receiptCode = page.evaluate(function()
                    {
                        try
                        {
                            return document.querySelector(".outputValueText").innerHTML;
                        }
                        catch(Exception){}
                    });

                    if(receiptCode !== null)
                    {
                        var validCode =
                            (receiptCode.trim) ? receiptCode.trim() : receiptCode.replace(/^\s+/,'');

                        // Use callback function to pass the valid code back to the webserver.
                        callback(validCode);
                        // Close the page.
                        page.close();
                        return;
                    }

                    break;

                // For whatever God forsaken reason, I have to call the click method on the DOM object, versus
                // dispatching click events to its location. LIKE I DO FOR EVERY OTHER BUTTON.
                case "https://www.inmoment.com/websurvey/2/execute":

                    queryString = urlQuerySelectorMap["https://www.inmoment.com/websurvey/2/execute"];
                    var succesfullyClicked = page.evaluate(function(selector)
                    {
                        try
                        {
                            document.querySelector(selector).click();
                            return true;
                        }
                        catch(Exception){return false}

                    }, queryString);

                    if(!succesfullyClicked)
                        newEvaluatePage(currentPage);

                    return;

                // This is the page where we actually submit our receipt's survey code.
                // For whatever reason, the page doesn't like it when we try to evaluate it, and
                // set the value property of the object (which is what we do elsewhere in the form).
                // So instead we dispatch a keypress event for each character in the redeem code.
                case "https://www.inmoment.com/websurvey/2/execute#/2":

                    console.log("Reached page 2 evaluation");

                    for(var i = 0; i < receiptNumber.length; i++)
                    {
                        page.sendEvent("keypress", receiptNumber[i]);
                    }
                    page.sendEvent('keypress', page.event.key.Tab);
                    page.sendEvent('keypress', page.event.key.Enter);

                    return;

                // This is the page where we're asked to specify what day and time we visited the restaurant. As well as
                // how we ordered.
                case "https://www.inmoment.com/websurvey/2/execute#/4":
                    // Tab into the date time selection and generate key presses.
                    // I think this date is nice, because it's several months ago at this point,
                    // and they don't seem to ask as many follow up questions because of that.
                    page.sendEvent("keypress", page.event.key.Tab);
                    for(var i = 0; i < "08/15/2017".length; i++)
                    {
                        page.sendEvent("keypress", "08/15/2017"[i]);
                    }

                    page.sendEvent("keypress", page.event.key.Tab);

                    // Dispatch the keypresses necessary for typing in the formatted
                    // time.
                    for(var i = 0, len = "09:45".length; i < len; i++)
                    {
                        page.sendEvent("keypress", "09:45"[i]);
                    }

                    // This page will be completed by the usual select element + tab + enter stuff.
                    break;

                // This is one of the pages that have a whole bunch of bubbles that ask about the quality of service/visit.
                // Tabbing into a row of bubbles isn't enough to select the first option, so we always end up selecting,
                // a 4/5 instead of 5/5 :/
                case "https://www.inmoment.com/websurvey/2/execute#/11":

                    for(var i = 0; i < 5; i++)
                    {
                        page.sendEvent('keypress', page.event.key.Tab);
                        page.sendEvent('keypress', page.event.key.Right);
                    }

                    page.sendEvent('keypress', page.event.key.Tab);
                    page.sendEvent('keypress', page.event.key.Enter);

                    break;
            }

            // Typically, most pages can be navigated by selecting options, pressing tab to navigate
            // to the next page button, and pressing enter to press the button.
            if(url in urlQuerySelectorMap)
            {
                // Create an array for coordinates of the elements we wish to select/press.
                var selectedElementCords = [];

                // Iterate over the query selection strings associated to the current url.
                for(var i = 0; i < urlQuerySelectorMap[url].length; i++)
                {
                    var queryString = urlQuerySelectorMap[url][i];
                    console.log(queryString);

                    // Get the coordinates for the given element.
                    var selectedElementCoord = page.evaluate(function (selector)
                    {
                        return document.querySelector(selector).getBoundingClientRect();
                    }, queryString);

                    console.log(selectedElementCoord);

                    // If the retrieved value was null, it's more than likely that the page hasn't completed loading.
                    // Which means, we'll need to re-evaluate the page. But this isn't the best way to do this.
                    if(selectedElementCoord === null)
                        setTimeout(newEvaluatePage(currentPage), 50);

                    selectedElementCords.push(selectedElementCoord);
                }

                console.log("Reached");

                // Iterate over our elements and press them!
                for(var i = 0; i < selectedElementCords.length; i++)
                {
                    var element = selectedElementCords[i];

                    console.log(element);
                    if(element != null)
                    {
                        x = element.left + ( element.width / 2);
                        y = element.top + ( element.height / 2);
                        page.sendEvent('click', x, y);
                        console.log("X: " + x + " Y: " + y);
                    }
                }

                // Press tab to navigate to next page button. Then press enter on button.
                page.sendEvent('keypress', page.event.key.Tab);
                page.sendEvent('keypress', page.event.key.Enter);

                console.log("Sent keypresses");

                // Take a screenshot in 2 secs.
                setTimeout(function()
                {
                    page.render("new" +  pageNum +  ".png");
                }, 2000);

            }
        }

        setTimeout(newEvaluatePage(currentPage), 100);

    }

    /**
     *  This is where I'd put all of my callbacks, IF THE SITE TRIGGERED ANY
     */
    page.onLoadFinished = function()
    {
        setTimeout(newEvaluatePage(currentPage), 500);
    };

    // Open the page. This is the entry point of our app.
    page.open("http://www.jacklistens.com/", function(status) {});
}