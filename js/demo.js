const $cookieNotice = $("#cookieNotice");
const weatherInterval = 1; /* seconds */

function openDatabase() {
    "use strict";

    if (!navigator.serviceWorker) {
        return Promise.resolve();
    }

    return idb.open("TU-stat", 1, function(upgradeDb) {
        const store = upgradeDb.createObjectStore("statuses", {
            keyPath: "id"
        });

        store.createIndex("date", "updated.date");
        store.createIndex("status", "summarystatus");
    });
}

(function serviceWorker() {
    if (!navigator.serviceWorker) return;

    navigator.serviceWorker.register("sw.js").then(function(reg) {
        if (!navigator.serviceWorker.controller) return;

        if (reg.waiting) {
            updateReady(reg.waiting);
            return;
        }

        if (reg.installing) {

            return;
        }

        reg.addEventListener("updatefound", function() {

            return;
        });
    });

})();

$(function init() {
   "use strict";

    /* EU cookie notice */
    // if (document.cookie.replace(/(?:(?:^|.*;\s*)cookieNoticeAck\s*\=\s*([^;]*).*$)|^.*$/, "$1") === "true") {
    //     $cookieNotice.hide();
    // } else {
    //     $cookieNotice.show();
    //     $cookieNotice.find("button.close").click(function () {
    //         if (document.cookie.replace(/(?:(?:^|.*;\s*)cookieNoticeAck\s*\=\s*([^;]*).*$)|^.*$/, "$1") !== "true") {
    //             document.cookie = "cookieNoticeAck=true; Expires=Fri, 31 Dec 9999 23:59:59 GMT; Secure; SameSite=Strict";
    //         }
    //     });
    // }

    const _dbPromise = openDatabase();
    let weatherTimer;
    let showingPosts = false;

    // updateSystemStatus();
    _showSystemStatuses().then(function() {
        _fetchStatuses();
    });

    $("#header-bar-weather").find(".weather-group").each(function () {
        $(this).find(".weather-item").eq(1).fadeToggle();
    });
    updateWeather();
    // setInterval(rotateWeatherItems, weatherInterval * 1000 * 7);

    weatherTimer = setTimeout(function weatherTimeout() {
        rotateWeatherItems();
        weatherTimer = setTimeout(weatherTimeout, weatherInterval * 1000 * 7);
    }, weatherInterval * 1000 * 7);

    setInterval(updateWeather, weatherInterval * 1000 * 3600);

    /* System Status */
    /* Should use WebSockets or Push Notifications for System Status, but infrastructure doesn't exist yet */
    function _showSystemStatuses() {
        let data = [];
        let index;

        return _dbPromise.then(function(db) {
            if (!db || showingPosts) {
                return;
            }

            index = db.transaction("statuses").objectStore("statuses").index("date");

            return index.openCursor(null, "prev").then(function getStatus(cursor) {
                if (!cursor) return;

                console.log(cursor.value);

                data.push(cursor.value);
                return cursor.continue.then(getStatus);
            }).then(function () {
                if (data.length > 0) {
                    _addStatuses(data);
                }
            });
        });
    }

    function _fetchStatuses() {
        const systemStatusUrl = "https://systemstatus.temple.edu/system_status/feedJSON";

        if (self.fetch) {
            fetch(systemStatusUrl).then(function(response) {
                if (response.ok) {
                    return response.json();
                } else {
                    throw Error(`Status: ${response.status}. ${response.statusText}`);
                }
            }).then(function(data) {
                _addStatuses(data);
            });
        } else {
            alert("Your browser does not support the latest JavaScript features. Please upgrade to the latest version of Chrome, Firefox, or Edge.");
        }
    }

    function _addStatuses(data) {
        const $systemStatus = $("#systemStatus");

        for (const status of data.entries) {
            const $oldStatusCard = $systemStatus.find("div[id='" + status.id + "']");
            const statusId = status.id;
            const statusUrl = `https://systemstatus.temple.edu/${status.link}`;
            const statusTitle = status.title;
            const statusCondition = status.summarystatus.split(": ")[1];
            const statusConditionClass = statusCondition.toLocaleLowerCase();
            const statusSummaryText = $("<div>").html(status.summarytext).text();
            const statusUpdateDateTime = formatDateTime(status.updated.date);


            let statusCard = `<div class="col-12 systemStatusCardContainer">
                                <div id="${statusId}" class="card systemStatusCard ${statusConditionClass}">
                                    <div class="card-body">
                                        <div class="row">
                                            <div class="col-9">
                                                <h1 class="card-title"><a href="https://systemstatus.temple.edu/${statusUrl}">${statusTitle}</a></h1>
                                            </div>
                                            <div class="col-3">
                                                <p class="status">${statusCondition}</p>
                                            </div>
                                        </div>
                                        <p class="card-text summary">${statusSummaryText}</p>
                                    </div>
                                    <div class="card-footer text-muted">
                                        <p class="timestamp"><b>Updated</b>: ${statusUpdateDateTime}</p>
                                    </div>
                                </div>
                              </div>`;

            if ($oldStatusCard.length > 0) {

            } else {
                $systemStatus.append(statusCard);
            }
        }


        /*for (const status of data.entries) {
            const $oldStatusCard = $systemStatus.find("div[id='" + status.id + "']");
            const statusId = status.id;
            const statusUrl = `https://systemstatus.temple.edu/${status.link}`;
            const statusTitle = status.title;
            const statusCondition = status.summarystatus.split(": ")[1];
            const statusConditionClass = statusCondition.toLocaleLowerCase();
            const statusSummaryText = $("<div>").html(status.summarytext).text();
            const statusUpdateDateTime = formatDateTime(status.updated.date);


            let statusCard = `<div class="col-12 systemStatusCardContainer">
                                <div id="${statusId}" class="card systemStatusCard ${statusConditionClass}">
                                    <div class="card-body">
                                        <div class="row">
                                            <div class="col-9">
                                                <h1 class="card-title"><a href="https://systemstatus.temple.edu/${statusUrl}">${statusTitle}</a></h1>
                                            </div>
                                            <div class="col-3">
                                                <p class="status">${statusCondition}</p>
                                            </div>
                                        </div>
                                        <p class="card-text summary">${statusSummaryText}</p>
                                    </div>
                                    <div class="card-footer text-muted">
                                        <p class="timestamp"><b>Updated</b>: ${statusUpdateDateTime}</p>
                                    </div>
                                </div>
                              </div>`;

            if ($oldStatusCard.length > 0) {

            } else {
                $systemStatus.append(statusCard);
            }
        }*/

        function formatDateTime(timestamp) {
            const dateTimeParts = timestamp.split(" ");

            const dateParts = dateTimeParts[0].split("-");
            const year = parseInt(dateParts[0]);
            const month = parseInt(dateParts[1]);
            const date = parseInt(dateParts[2]);
            const timeParts = dateTimeParts[1].split(":");
            const hour = parseInt(timeParts[0]);
            const minutes = parseInt(timeParts[1]);
            const datetime = new Date(year, month, date, hour, minutes, 0, 0);

            return new Intl.DateTimeFormat("en-US", {weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "numeric", minute: "numeric" }).format(datetime);
        }
    }
});

function updateSystemStatus() {
    "use strict";

    const systemStatusUrl = "https://systemstatus.temple.edu/system_status/feedJSON";
    let hasNetworkData = false;
    let networkResponse;

    if (self.fetch) {
        toggleSpinner();

        networkResponse = fetch(systemStatusUrl).then(function(response) {
           if (response.ok) {
               return response.json();
           } else {
               throw Error(`Status: ${response.status}. ${response.statusText}`);
           }
        }).then(function(data) {
            hasNetworkData = true;
            displayStatuses(data);
        });

        caches.match(systemStatusUrl).then(function(response) {
           if (!response) throw Error("No data");
           return response.json();
        }).then(function(data) {
            if (!hasNetworkData) {
                displayStatuses(data);
            }
        }).catch(function() {
            return networkResponse;
        }).catch(function() {
            // TODO: Display Error

        }).then(function() {
            toggleSpinner();
        });
    } else {
        alert("Your browser does not support the latest JavaScript features. Please upgrade to the latest version of Chrome, Firefox, or Edge.");
    }

    function displayStatuses(data) {
        const $systemStatus = $("#systemStatus");

        for (const status of data.entries) {
            const $oldStatusCard = $systemStatus.find("div[id='" + status.id + "']");
            const statusId = status.id;
            const statusUrl = `https://systemstatus.temple.edu/${status.link}`;
            const statusTitle = status.title;
            const statusCondition = status.summarystatus.split(": ")[1];
            const statusConditionClass = statusCondition.toLocaleLowerCase();
            const statusSummaryText = $("<div>").html(status.summarytext).text();
            const statusUpdateDateTime = formatDateTime(status.updated.date);


            let statusCard = `<div class="col-12 systemStatusCardContainer">
                                <div id="${statusId}" class="card systemStatusCard ${statusConditionClass}">
                                    <div class="card-body">
                                        <div class="row">
                                            <div class="col-9">
                                                <h1 class="card-title"><a href="https://systemstatus.temple.edu/${statusUrl}">${statusTitle}</a></h1>
                                            </div>
                                            <div class="col-3">
                                                <p class="status">${statusCondition}</p>
                                            </div>
                                        </div>
                                        <p class="card-text summary">${statusSummaryText}</p>
                                    </div>
                                    <div class="card-footer text-muted">
                                        <p class="timestamp"><b>Updated</b>: ${statusUpdateDateTime}</p>
                                    </div>
                                </div>
                              </div>`;

            if ($oldStatusCard.length > 0) {

            } else {
                $systemStatus.append(statusCard);
            }
        }

        function formatDateTime(timestamp) {
            const dateTimeParts = timestamp.split(" ");

            const dateParts = dateTimeParts[0].split("-");
            const year = parseInt(dateParts[0]);
            const month = parseInt(dateParts[1]);
            const date = parseInt(dateParts[2]);
            const timeParts = dateTimeParts[1].split(":");
            const hour = parseInt(timeParts[0]);
            const minutes = parseInt(timeParts[1]);
            const datetime = new Date(year, month, date, hour, minutes, 0, 0);

            return new Intl.DateTimeFormat("en-US", {weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "numeric", minute: "numeric" }).format(datetime);
        }

    }
}

function toggleSpinner() {
    "use strict";

    $("#loaderContainer").find(".loader").toggle();
}

/* Weather */
function shadeBlend(p,c0,c1) {
    "use strict";

    let n=p<0?p*-1:p,u=Math.round,w=parseInt;
    if(c0.length>7){
        let f=c0.split(","),t=(c1?c1:p<0?"rgb(0,0,0)":"rgb(255,255,255)").split(","),R=w(f[0].slice(4)),G=w(f[1]),B=w(f[2]);
        return "rgb("+(u((w(t[0].slice(4))-R)*n)+R)+","+(u((w(t[1])-G)*n)+G)+","+(u((w(t[2])-B)*n)+B)+")"
    } else {
        let f=w(c0.slice(1),16),t=w((c1?c1:p<0?"#000000":"#FFFFFF").slice(1),16),R1=f>>16,G1=f>>8&0x00FF,B1=f&0x0000FF;
        return "#"+(0x1000000+(u(((t>>16)-R1)*n)+R1)*0x10000+(u(((t>>8&0x00FF)-G1)*n)+G1)*0x100+(u(((t&0x0000FF)-B1)*n)+B1)).toString(16).slice(1)
    }
}

function updateWeather() {
    "use strict";
    const temperatureColorHotStart = "#FFF2DB";
    const temperatureColorHotEnd = "#FF0000";
    const temperatureColorColdStart = "#0493F9";
    const temperatureColorColdEnd = "#6EC4E8";
    const noaaIconMapDay = {
        "Partly Cloudy": "wi-day-cloudy",
        "Mostly Cloudy": "wi-day-cloudy",
        "Cloudy": "wi-day-cloudy",
        "Mostly Clear": "wi-day-sunny",
        "Clear": "wi-day-sunny",
        "Mostly Cloudy and Windy": "wi-day-cloudy-windy",
        "Thunderstorms and Rain and Fog/Mist": "wi-day-thunderstorm",
        "Thunderstorms": "wi-day-thunderstorm",
        "Haze": "wi-day-haze",
        "Light Rain": "wi-day-rain",
        "Light Rain and Fog/Mist": "wi-day-rain",
        "Fog/Mist": "wi-day-fog",
        "Light Drizzle and Fog/Mist": "wi-day-fog",
        "Light Snow": "wi-day-snow",
        "Light Snow and Fog/Mist": "wi-day-snow"
    };
    const noaaIconMapNight = {
        "Partly Cloudy": "wi-night-alt-partly-cloudy",
        "Mostly Cloudy": "wi-night-alt-cloudy",
        "Cloudy": "wi-night-alt-cloudy",
        "Mostly Clear": "wi-night-clear",
        "Clear": "wi-night-clear",
        "Mostly Cloudy and Windy": "wi-night-alt-cloudy-windy",
        "Thunderstorms and Rain and Fog/Mist": "wi-night-alt-thunderstorm",
        "Thunderstorms": "wi-night-alt-thunderstorm",
        "Light Rain": "wi-night-alt-rain",
        "Light Rain and Fog/Mist": "wi-night-alt-rain",
        "Fog/Mist": "wi-night-fog",
        "Light Drizzle and Fog/Mist": "wi-night-fog",
        "Light Snow": "wi-night-snow",
        "Light Snow and Fog/Mist": "wi-day-snow"
    };
    const yahooIconMap = ["wi-tornado", "wi-rain-wind", "wi-hurricane", "wi-thunderstorm", "wi-rain-mix", "wi-snow",
        "wi-sleet", "wi-sleet", "wi-rain", "wi-sleet", "wi-showers", "wi-showers", "wi-showers", "wi-snow-wind", "wi-snow",
        "wi-snow-wind", "wi-snow", "wi-hail", "wi-sleet", "wi-dust", "wi-fog", "wi-day-haze", "wi-smoke", "wi-strong-wind",
        "wi-strong-wind", "wi-wi-snowflake-cold", "wi-cloudy", "wi-night-alt-cloudy", "wi-day-cloudy",
        "wi-night-alt-partly-cloudy", "wi-day-cloudy", "wi-night-alt-partly-cloudy", "wi-day-sunny", "wi-stars",
        "wi-day-sunny", "wi-hail", "wi-hot", "wi-thunderstorm", "wi-thunderstorm", "wi-thunderstorm", "wi-showers",
        "wi-snow", "wi-snow", "wi-snow", "wi-cloudy", "wi-storm-showers", "wi-snow", "wi-storm-showers"];
    const wundergroundUrl = "https://www.wunderground.com/cgi-bin/findweather/getForecast?query=";
    const useCelsius = document.cookie.replace(/(?:(?:^|.*;\s*)browserLocation\s*\=\s*([^;]*).*$)|^.*$/, "$1") !== "US";
    const hotMax = useCelsius ? 48.89 : 120;
    const hotMin = useCelsius ? 23.89 : 75;
    const coldMax = useCelsius ? 15.56 : 60;
    const coldMin = useCelsius ? -40 : -40;
    const temperatureUnit = useCelsius ? "C" : "F";

    // Retrieve international weather via Yahoo! Weather
    $(".weather-item.intl-weather").each(function () {
       const $this = $(this);
       const location = $this.find(".weather-item-location").attr("data-location");
       const query = "select item.condition, item.link from weather.forecast where woeid in (select woeid from geo.places(1) where text = '" + location + "') and u='" + temperatureUnit.toLowerCase() + "'";
       const url = "https://query.yahooapis.com/v1/public/yql?q=" + query + "&format=json";

       if (self.fetch) {
           fetch(url).then(function (response) {
               if (response.ok) {
                   return response.json();
               } else {
                   throw Error(`Status: ${response.status}. ${response.statusText}`);
               }
           }).then(function (json) {
               const $weatherIcon = $(this).find(".weather-icon");
               let conditionCode;
               let temperature;
               let temperatureColor;

               if (json.query.count > 0) {
                   // Set weather icon
                   conditionCode = json.query.results.channel.item.condition.code;
                   if (conditionCode === 3200) {
                       $weatherIcon.hide();
                   } else {
                       $weatherIcon.show();
                       $this.find(".wi").addClass(yahooIconMap[conditionCode]);
                   }

                   // Set weather details
                   temperature = json.query.results.channel.item.condition.temp;

                   if (temperature >= hotMin) {
                       temperatureColor = shadeBlend((temperature - hotMin) / (hotMax - hotMin), temperatureColorHotStart, temperatureColorHotEnd);
                   } else if (temperature <= coldMax) {
                       temperatureColor = shadeBlend((temperature - (coldMin)) / (coldMax - (coldMin)), temperatureColorColdStart, temperatureColorColdEnd);
                   } else {
                       temperatureColor = "#FFFFFF";
                   }

                   $this.find(".weather-item-details").css("color", temperatureColor).html(temperature + "&deg;" + temperatureUnit + " ");

                   // Set tooltip
                   $this.attr("title", json.query.results.channel.item.condition.text).tooltip({
                       "toggle": "tooltip", "placement": "auto", "container": "body",
                       "template": `<div class="tooltip" role="tooltip"><div class="tooltip-arrow"></div><div class="tooltip-inner"></div></div>`
                   });
               }
           }).catch(function (error) {
               console.error("There was an issue retrieving weather data.", error.message);
           }).finally(function() {
               // Set links
               $this.find("a").attr("href", wundergroundUrl + location);
           });
       } else {
           alert("Your browser does not support the latest JavaScript features. Please upgrade to the latest version of Chrome, Firefox, or Edge.");
       }
    });

    // Retrieve US weather via NOAA API
    $(".weather-item.us-weather").each(function () {
        const $this = $(this);
        const location = $this.find(".weather-item-location").attr("data-location");
        const url = "https://api.weather.gov/stations/" + location + "/observations/current";

        if (self.fetch) {
            fetch(url).then(function (response) {
                if (response.ok) {
                    return response.json();
                } else {
                    throw Error(`Status: ${response.status}. ${response.statusText}`);
                }
            }).then(function (json) {
                const textDescription = json.properties.textDescription;
                let temperature = parseInt(json.properties.temperature.value);
                let temperatureColor;

                // Set weather icon
                const now = new Date();
                if (now.getHours() >= 6 && now.getHours() <= 18) {
                    $this.find(".wi").addClass(noaaIconMapDay[textDescription]);
                } else {
                    $this.find(".wi").addClass(noaaIconMapNight[textDescription]);
                }

                // Set weather details
                if (isNaN(temperature)) {
                    $this.find(".weather-item-details").html("---");
                } else {
                    if (useCelsius) {
                        temperature = Math.round(temperature);
                    } else {
                        temperature = Math.round(temperature * 1.8 + 32);
                    }

                    if (temperature >= hotMin) {
                        temperatureColor = shadeBlend((temperature - hotMin) / (hotMax - hotMin), temperatureColorHotStart, temperatureColorHotEnd);
                    } else if (temperature <= coldMax) {
                        temperatureColor = shadeBlend((temperature - (coldMin)) / (coldMax - (coldMin)), temperatureColorColdStart, temperatureColorColdEnd);
                    } else {
                        temperatureColor = "#FFFFFF";
                    }

                    $this.find(".weather-item-details").css("color", temperatureColor).html(temperature + "&deg;" + temperatureUnit);
                }

                // Set tooltip
                $this.attr("title", textDescription).tooltip({
                    "toggle": "tooltip", "placement": "auto", "container": "body",
                    "template": `<div class="tooltip" role="tooltip"><div class="tooltip-arrow"></div><div class="tooltip-inner"></div></div>`
                });
            }).catch(function (error) {
                console.error("There was an issue retrieving weather data.", error.message);
            }).finally(function() {
                // Set links
                $this.find("a").attr("href", wundergroundUrl + location);
            });
        } else {
            alert("Your browser does not support the latest JavaScript features. Please upgrade to the latest version of Chrome, Firefox, or Edge.");
        }
    });
}

function processWeatherData(json) {
    "use strict";
}

function rotateWeatherItems() {
    "use strict";

    $("#header-bar-weather .weather-group").each(function(i) {
        setTimeout(changeWeather, i*weatherInterval*1000, $(this));
    });

    function changeWeather($weatherGroup) {
        $weatherGroup.find(".weather-item").fadeToggle();
    }
}