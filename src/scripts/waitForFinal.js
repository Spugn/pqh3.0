/**
 * THIS FUNCTION WILL EXECUTE A CALLBACK AFTER THE USER STOPS MAKING CHANGES.
 *
 * EXAMPLE USAGE:
 * waitForFinal(function () {
 *    // do something
 * }, 500, "some-unique-id")
 */
const waitForFinal = (function () {
    let timers = {};
    return function (callback, ms, uniqueID) {
        if (!uniqueID) {
            uniqueID = "Don't call this twice without an uniqueID";
        }
        if (timers[uniqueID]) {
            clearTimeout(timers[uniqueID]);
        }
        timers[uniqueID] = setTimeout(callback, ms);
    }
})
export default waitForFinal;