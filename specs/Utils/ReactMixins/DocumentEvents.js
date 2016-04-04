import _ from 'lodash';

export const TestDocumentEventsMixin = function(obj, done) {

    // backup existing cache
    var existingCache = _.clone(obj._documentEventCache);
    // and clear it
    obj._documentEventCache = {};

    var callbackCalled = false;
    var calledEvent = null;
    obj.testCallback = function(event) {
        callbackCalled = true;
        calledEvent = event;
    };

    spyOn(obj, 'testCallback').and.callThrough();

    // add an bound method
    var callback1 = obj.boundMethod('testCallback');

    // should be one entry in the cache
    expect(_.size(obj._documentEventCache)).toEqual(1);

    // second call should be the same callback
    expect(obj.boundMethod('testCallback')).toBe(callback1);

    // remove the bound method
    obj.clearDocumentEventCache('testCallback');

    // should be no more entry in the cache
    expect(_.size(obj._documentEventCache)).toEqual(0);

    // add it again, should not be the same
    var callback2 = obj.boundMethod('testCallback');
    expect(callback2).not.toBe(callback1);

    // clear all cache
    obj.clearAllDocumentEventsCache();

    // should be no more entry in the cache
    expect(_.size(obj._documentEventCache)).toEqual(0);

    // add a listener
    obj.addDocumentListener('fake_event', 'testCallback');

    // should be one entry in the cache
    expect(_.size(obj._documentEventCache)).toEqual(1);

    // method should be called when event fired
    document.dispatchEvent(new Event('fake_event'));

    // leave time for the event to be catched
    setTimeout(function() {
        expect(obj.testCallback.calls.count()).toEqual(1);
        expect(callbackCalled).toBe(true);
        expect(calledEvent).not.toBe(null);
        expect(calledEvent.type).toEqual('fake_event');

        // remove the listener
        obj.removeDocumentListener('fake_event', 'testCallback');

        // method should not be called anymore
        callbackCalled = false;
        obj.testCallback.calls.reset();

        document.dispatchEvent(new Event('fake_event'));

        // leave time for the event to be catched
        setTimeout(function() {
            expect(obj.testCallback.calls.count()).toEqual(0);
            expect(callbackCalled).toBe(false);

            // restore the cache
            obj._documentEventCache = existingCache;

            // tell jasmine we're done
            done();
        }, 0.01);

    }, 0.01);

};
