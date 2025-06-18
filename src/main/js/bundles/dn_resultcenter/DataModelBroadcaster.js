/*
 * Copyright (C) 2025 con terra GmbH (info@conterra.de)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import d_lang from "dojo/_base/lang";
import declare from "dojo/_base/declare";
import _Connect from "ct/_Connect";

export default declare([_Connect], /** @lends resultcenter.DataModelBroadcaster.prototype */ {
    defaultTopicBase: "ct/resultcenter/datamodel/",
    /**
     * @constructs
     */
    constructor: function () {
        // Injected
        this._dataModel = null;
        this._eventService = null;
    },
    activate: function () {
        this._topicBase = this._properties._topicBase || this.defaultTopicBase;
        this._connectToDataModelEvents();
    },
    deactivate: function () {
        this.disconnect();
    },
    _connectToDataModelEvents: function () {
        // DataModel events
        this._connectBroadCast(this._dataModel, "onUpdateStart", "UPDATE_START");
        this._connectBroadCast(this._dataModel, "onUpdateEnd", "UPDATE_END");
    },
    _connectBroadCast: function (source, evt, topic) {
        topic = this._topicBase + topic;
        this.connect(source, evt, d_lang.partial(this._broadCast, topic));
    },
    _broadCast: function (topic, evtObj) {
        this._eventService.postEvent(topic, evtObj);
    }
});
