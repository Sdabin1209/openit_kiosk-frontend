// 생성 파일: node scripts/gen-types.mjs (직접 고치지 않는다). 출처: schemas/*.json, boundary-contracts DeviceConfig, KioskStartFragment, StaffPushPayload, StaffCallReport, StaffCallRetryRequest, PushSubscriptionRequest, HealthStatus (패키지 버전 5.0.1).
/* eslint-disable */
"use strict";
var __getOwnPropNames = Object.getOwnPropertyNames;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};

// node_modules/ajv/dist/runtime/ucs2length.js
var require_ucs2length = __commonJS({
  "node_modules/ajv/dist/runtime/ucs2length.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    function ucs2length(str) {
      const len = str.length;
      let length = 0;
      let pos = 0;
      let value;
      while (pos < len) {
        length++;
        value = str.charCodeAt(pos++);
        if (value >= 55296 && value <= 56319 && pos < len) {
          value = str.charCodeAt(pos);
          if ((value & 64512) === 56320)
            pos++;
        }
      }
      return length;
    }
    exports2.default = ucs2length;
    ucs2length.code = 'require("ajv/dist/runtime/ucs2length").default';
  }
});

// node_modules/ajv-formats/dist/formats.js
var require_formats = __commonJS({
  "node_modules/ajv-formats/dist/formats.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.formatNames = exports2.fastFormats = exports2.fullFormats = void 0;
    function fmtDef(validate, compare) {
      return { validate, compare };
    }
    exports2.fullFormats = {
      // date: http://tools.ietf.org/html/rfc3339#section-5.6
      date: fmtDef(date, compareDate),
      // date-time: http://tools.ietf.org/html/rfc3339#section-5.6
      time: fmtDef(getTime(true), compareTime),
      "date-time": fmtDef(getDateTime(true), compareDateTime),
      "iso-time": fmtDef(getTime(), compareIsoTime),
      "iso-date-time": fmtDef(getDateTime(), compareIsoDateTime),
      // duration: https://tools.ietf.org/html/rfc3339#appendix-A
      duration: /^P(?!$)((\d+Y)?(\d+M)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+S)?)?|(\d+W)?)$/,
      uri,
      "uri-reference": /^(?:[a-z][a-z0-9+\-.]*:)?(?:\/?\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:]|%[0-9a-f]{2})*@)?(?:\[(?:(?:(?:(?:[0-9a-f]{1,4}:){6}|::(?:[0-9a-f]{1,4}:){5}|(?:[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){4}|(?:(?:[0-9a-f]{1,4}:){0,1}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){3}|(?:(?:[0-9a-f]{1,4}:){0,2}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){2}|(?:(?:[0-9a-f]{1,4}:){0,3}[0-9a-f]{1,4})?::[0-9a-f]{1,4}:|(?:(?:[0-9a-f]{1,4}:){0,4}[0-9a-f]{1,4})?::)(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?))|(?:(?:[0-9a-f]{1,4}:){0,5}[0-9a-f]{1,4})?::[0-9a-f]{1,4}|(?:(?:[0-9a-f]{1,4}:){0,6}[0-9a-f]{1,4})?::)|[Vv][0-9a-f]+\.[a-z0-9\-._~!$&'()*+,;=:]+)\]|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)|(?:[a-z0-9\-._~!$&'"()*+,;=]|%[0-9a-f]{2})*)(?::\d*)?(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*|\/(?:(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*)?|(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*)?(?:\?(?:[a-z0-9\-._~!$&'"()*+,;=:@/?]|%[0-9a-f]{2})*)?(?:#(?:[a-z0-9\-._~!$&'"()*+,;=:@/?]|%[0-9a-f]{2})*)?$/i,
      // uri-template: https://tools.ietf.org/html/rfc6570
      "uri-template": /^(?:(?:[^\x00-\x20"'<>%\\^`{|}]|%[0-9a-f]{2})|\{[+#./;?&=,!@|]?(?:[a-z0-9_]|%[0-9a-f]{2})+(?::[1-9][0-9]{0,3}|\*)?(?:,(?:[a-z0-9_]|%[0-9a-f]{2})+(?::[1-9][0-9]{0,3}|\*)?)*\})*$/i,
      // For the source: https://gist.github.com/dperini/729294
      // For test cases: https://mathiasbynens.be/demo/url-regex
      url: /^(?:https?|ftp):\/\/(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z0-9\u{00a1}-\u{ffff}]+-)*[a-z0-9\u{00a1}-\u{ffff}]+)(?:\.(?:[a-z0-9\u{00a1}-\u{ffff}]+-)*[a-z0-9\u{00a1}-\u{ffff}]+)*(?:\.(?:[a-z\u{00a1}-\u{ffff}]{2,})))(?::\d{2,5})?(?:\/[^\s]*)?$/iu,
      email: /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i,
      hostname: /^(?=.{1,253}\.?$)[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[-0-9a-z]{0,61}[0-9a-z])?)*\.?$/i,
      // optimized https://www.safaribooksonline.com/library/view/regular-expressions-cookbook/9780596802837/ch07s16.html
      ipv4: /^(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/,
      ipv6: /^((([0-9a-f]{1,4}:){7}([0-9a-f]{1,4}|:))|(([0-9a-f]{1,4}:){6}(:[0-9a-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9a-f]{1,4}:){5}(((:[0-9a-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9a-f]{1,4}:){4}(((:[0-9a-f]{1,4}){1,3})|((:[0-9a-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){3}(((:[0-9a-f]{1,4}){1,4})|((:[0-9a-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){2}(((:[0-9a-f]{1,4}){1,5})|((:[0-9a-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){1}(((:[0-9a-f]{1,4}){1,6})|((:[0-9a-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9a-f]{1,4}){1,7})|((:[0-9a-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))$/i,
      regex,
      // uuid: http://tools.ietf.org/html/rfc4122
      uuid: /^(?:urn:uuid:)?[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i,
      // JSON-pointer: https://tools.ietf.org/html/rfc6901
      // uri fragment: https://tools.ietf.org/html/rfc3986#appendix-A
      "json-pointer": /^(?:\/(?:[^~/]|~0|~1)*)*$/,
      "json-pointer-uri-fragment": /^#(?:\/(?:[a-z0-9_\-.!$&'()*+,;:=@]|%[0-9a-f]{2}|~0|~1)*)*$/i,
      // relative JSON-pointer: http://tools.ietf.org/html/draft-luff-relative-json-pointer-00
      "relative-json-pointer": /^(?:0|[1-9][0-9]*)(?:#|(?:\/(?:[^~/]|~0|~1)*)*)$/,
      // the following formats are used by the openapi specification: https://spec.openapis.org/oas/v3.0.0#data-types
      // byte: https://github.com/miguelmota/is-base64
      byte,
      // signed 32 bit integer
      int32: { type: "number", validate: validateInt32 },
      // signed 64 bit integer
      int64: { type: "number", validate: validateInt64 },
      // C-type float
      float: { type: "number", validate: validateNumber },
      // C-type double
      double: { type: "number", validate: validateNumber },
      // hint to the UI to hide input strings
      password: true,
      // unchecked string payload
      binary: true
    };
    exports2.fastFormats = {
      ...exports2.fullFormats,
      date: fmtDef(/^\d\d\d\d-[0-1]\d-[0-3]\d$/, compareDate),
      time: fmtDef(/^(?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)$/i, compareTime),
      "date-time": fmtDef(/^\d\d\d\d-[0-1]\d-[0-3]\dt(?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)$/i, compareDateTime),
      "iso-time": fmtDef(/^(?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)?$/i, compareIsoTime),
      "iso-date-time": fmtDef(/^\d\d\d\d-[0-1]\d-[0-3]\d[t\s](?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)?$/i, compareIsoDateTime),
      // uri: https://github.com/mafintosh/is-my-json-valid/blob/master/formats.js
      uri: /^(?:[a-z][a-z0-9+\-.]*:)(?:\/?\/)?[^\s]*$/i,
      "uri-reference": /^(?:(?:[a-z][a-z0-9+\-.]*:)?\/?\/)?(?:[^\\\s#][^\s#]*)?(?:#[^\\\s]*)?$/i,
      // email (sources from jsen validator):
      // http://stackoverflow.com/questions/201323/using-a-regular-expression-to-validate-an-email-address#answer-8829363
      // http://www.w3.org/TR/html5/forms.html#valid-e-mail-address (search for 'wilful violation')
      email: /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*$/i
    };
    exports2.formatNames = Object.keys(exports2.fullFormats);
    function isLeapYear(year) {
      return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    }
    var DATE = /^(\d\d\d\d)-(\d\d)-(\d\d)$/;
    var DAYS = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    function date(str) {
      const matches = DATE.exec(str);
      if (!matches)
        return false;
      const year = +matches[1];
      const month = +matches[2];
      const day = +matches[3];
      return month >= 1 && month <= 12 && day >= 1 && day <= (month === 2 && isLeapYear(year) ? 29 : DAYS[month]);
    }
    function compareDate(d1, d2) {
      if (!(d1 && d2))
        return void 0;
      if (d1 > d2)
        return 1;
      if (d1 < d2)
        return -1;
      return 0;
    }
    var TIME = /^(\d\d):(\d\d):(\d\d(?:\.\d+)?)(z|([+-])(\d\d)(?::?(\d\d))?)?$/i;
    function getTime(strictTimeZone) {
      return function time(str) {
        const matches = TIME.exec(str);
        if (!matches)
          return false;
        const hr = +matches[1];
        const min = +matches[2];
        const sec = +matches[3];
        const tz = matches[4];
        const tzSign = matches[5] === "-" ? -1 : 1;
        const tzH = +(matches[6] || 0);
        const tzM = +(matches[7] || 0);
        if (tzH > 23 || tzM > 59 || strictTimeZone && !tz)
          return false;
        if (hr <= 23 && min <= 59 && sec < 60)
          return true;
        const utcMin = min - tzM * tzSign;
        const utcHr = hr - tzH * tzSign - (utcMin < 0 ? 1 : 0);
        return (utcHr === 23 || utcHr === -1) && (utcMin === 59 || utcMin === -1) && sec < 61;
      };
    }
    function compareTime(s1, s2) {
      if (!(s1 && s2))
        return void 0;
      const t1 = (/* @__PURE__ */ new Date("2020-01-01T" + s1)).valueOf();
      const t2 = (/* @__PURE__ */ new Date("2020-01-01T" + s2)).valueOf();
      if (!(t1 && t2))
        return void 0;
      return t1 - t2;
    }
    function compareIsoTime(t1, t2) {
      if (!(t1 && t2))
        return void 0;
      const a1 = TIME.exec(t1);
      const a2 = TIME.exec(t2);
      if (!(a1 && a2))
        return void 0;
      t1 = a1[1] + a1[2] + a1[3];
      t2 = a2[1] + a2[2] + a2[3];
      if (t1 > t2)
        return 1;
      if (t1 < t2)
        return -1;
      return 0;
    }
    var DATE_TIME_SEPARATOR = /t|\s/i;
    function getDateTime(strictTimeZone) {
      const time = getTime(strictTimeZone);
      return function date_time(str) {
        const dateTime = str.split(DATE_TIME_SEPARATOR);
        return dateTime.length === 2 && date(dateTime[0]) && time(dateTime[1]);
      };
    }
    function compareDateTime(dt1, dt2) {
      if (!(dt1 && dt2))
        return void 0;
      const d1 = new Date(dt1).valueOf();
      const d2 = new Date(dt2).valueOf();
      if (!(d1 && d2))
        return void 0;
      return d1 - d2;
    }
    function compareIsoDateTime(dt1, dt2) {
      if (!(dt1 && dt2))
        return void 0;
      const [d1, t1] = dt1.split(DATE_TIME_SEPARATOR);
      const [d2, t2] = dt2.split(DATE_TIME_SEPARATOR);
      const res = compareDate(d1, d2);
      if (res === void 0)
        return void 0;
      return res || compareTime(t1, t2);
    }
    var NOT_URI_FRAGMENT = /\/|:/;
    var URI = /^(?:[a-z][a-z0-9+\-.]*:)(?:\/?\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:]|%[0-9a-f]{2})*@)?(?:\[(?:(?:(?:(?:[0-9a-f]{1,4}:){6}|::(?:[0-9a-f]{1,4}:){5}|(?:[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){4}|(?:(?:[0-9a-f]{1,4}:){0,1}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){3}|(?:(?:[0-9a-f]{1,4}:){0,2}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){2}|(?:(?:[0-9a-f]{1,4}:){0,3}[0-9a-f]{1,4})?::[0-9a-f]{1,4}:|(?:(?:[0-9a-f]{1,4}:){0,4}[0-9a-f]{1,4})?::)(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?))|(?:(?:[0-9a-f]{1,4}:){0,5}[0-9a-f]{1,4})?::[0-9a-f]{1,4}|(?:(?:[0-9a-f]{1,4}:){0,6}[0-9a-f]{1,4})?::)|[Vv][0-9a-f]+\.[a-z0-9\-._~!$&'()*+,;=:]+)\]|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)|(?:[a-z0-9\-._~!$&'()*+,;=]|%[0-9a-f]{2})*)(?::\d*)?(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*|\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*)?|(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*)(?:\?(?:[a-z0-9\-._~!$&'()*+,;=:@/?]|%[0-9a-f]{2})*)?(?:#(?:[a-z0-9\-._~!$&'()*+,;=:@/?]|%[0-9a-f]{2})*)?$/i;
    function uri(str) {
      return NOT_URI_FRAGMENT.test(str) && URI.test(str);
    }
    var BYTE = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/gm;
    function byte(str) {
      BYTE.lastIndex = 0;
      return BYTE.test(str);
    }
    var MIN_INT32 = -(2 ** 31);
    var MAX_INT32 = 2 ** 31 - 1;
    function validateInt32(value) {
      return Number.isInteger(value) && value <= MAX_INT32 && value >= MIN_INT32;
    }
    function validateInt64(value) {
      return Number.isInteger(value);
    }
    function validateNumber() {
      return true;
    }
    var Z_ANCHOR = /[^\\]\\Z/;
    function regex(str) {
      if (Z_ANCHOR.test(str))
        return false;
      try {
        new RegExp(str);
        return true;
      } catch (e) {
        return false;
      }
    }
  }
});

// node_modules/fast-deep-equal/index.js
var require_fast_deep_equal = __commonJS({
  "node_modules/fast-deep-equal/index.js"(exports2, module2) {
    "use strict";
    module2.exports = function equal(a, b) {
      if (a === b) return true;
      if (a && b && typeof a == "object" && typeof b == "object") {
        if (a.constructor !== b.constructor) return false;
        var length, i, keys;
        if (Array.isArray(a)) {
          length = a.length;
          if (length != b.length) return false;
          for (i = length; i-- !== 0; )
            if (!equal(a[i], b[i])) return false;
          return true;
        }
        if (a.constructor === RegExp) return a.source === b.source && a.flags === b.flags;
        if (a.valueOf !== Object.prototype.valueOf) return a.valueOf() === b.valueOf();
        if (a.toString !== Object.prototype.toString) return a.toString() === b.toString();
        keys = Object.keys(a);
        length = keys.length;
        if (length !== Object.keys(b).length) return false;
        for (i = length; i-- !== 0; )
          if (!Object.prototype.hasOwnProperty.call(b, keys[i])) return false;
        for (i = length; i-- !== 0; ) {
          var key = keys[i];
          if (!equal(a[key], b[key])) return false;
        }
        return true;
      }
      return a !== a && b !== b;
    };
  }
});

// node_modules/ajv/dist/runtime/equal.js
var require_equal = __commonJS({
  "node_modules/ajv/dist/runtime/equal.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var equal = require_fast_deep_equal();
    equal.code = 'require("ajv/dist/runtime/equal").default';
    exports2.default = equal;
  }
});

// validators.cjs
exports.AlertInfoInput = validate20;
var schema31 = { "$id": "AlertInfoInput.json", "title": "AlertInfoInput", "description": "\uC54C\uB9BC \uBCF4\uC870 \uC815\uBCF4 \uC785\uB825: \uACC4\uC57D StaffAlert\uC758 2.1.0 \uC120\uD0DD \uD544\uB4DC\uB9CC \uC77D\uB294\uB2E4. \uBAA8\uB974\uB294 \uAC12\uB3C4 \uADF8\uB300\uB85C \uBCF4\uC778\uB2E4(\uAD00\uB300\uD558\uAC8C \uC77D\uAE30).", "type": "object", "properties": { "delivery_attempts": { "type": "integer", "minimum": 0 }, "last_delivery_status": { "type": ["string", "null"] }, "manual_notice_outcome": { "type": ["string", "null"] }, "manual_notice_reported_at": { "type": ["string", "null"] }, "pause_reason": { "type": ["string", "null"] } }, "required": [], "additionalProperties": true };
function validate20(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  ;
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate20.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.delivery_attempts !== void 0) {
      let data0 = data.delivery_attempts;
      if (!(typeof data0 == "number" && (!(data0 % 1) && !isNaN(data0)))) {
        const err0 = { instancePath: instancePath + "/delivery_attempts", schemaPath: "#/properties/delivery_attempts/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
        if (vErrors === null) {
          vErrors = [err0];
        } else {
          vErrors.push(err0);
        }
        errors++;
      }
      if (typeof data0 == "number") {
        if (data0 < 0 || isNaN(data0)) {
          const err1 = { instancePath: instancePath + "/delivery_attempts", schemaPath: "#/properties/delivery_attempts/minimum", keyword: "minimum", params: { comparison: ">=", limit: 0 }, message: "must be >= 0" };
          if (vErrors === null) {
            vErrors = [err1];
          } else {
            vErrors.push(err1);
          }
          errors++;
        }
      }
    }
    if (data.last_delivery_status !== void 0) {
      let data1 = data.last_delivery_status;
      if (typeof data1 !== "string" && data1 !== null) {
        const err2 = { instancePath: instancePath + "/last_delivery_status", schemaPath: "#/properties/last_delivery_status/type", keyword: "type", params: { type: schema31.properties.last_delivery_status.type }, message: "must be string,null" };
        if (vErrors === null) {
          vErrors = [err2];
        } else {
          vErrors.push(err2);
        }
        errors++;
      }
    }
    if (data.manual_notice_outcome !== void 0) {
      let data2 = data.manual_notice_outcome;
      if (typeof data2 !== "string" && data2 !== null) {
        const err3 = { instancePath: instancePath + "/manual_notice_outcome", schemaPath: "#/properties/manual_notice_outcome/type", keyword: "type", params: { type: schema31.properties.manual_notice_outcome.type }, message: "must be string,null" };
        if (vErrors === null) {
          vErrors = [err3];
        } else {
          vErrors.push(err3);
        }
        errors++;
      }
    }
    if (data.manual_notice_reported_at !== void 0) {
      let data3 = data.manual_notice_reported_at;
      if (typeof data3 !== "string" && data3 !== null) {
        const err4 = { instancePath: instancePath + "/manual_notice_reported_at", schemaPath: "#/properties/manual_notice_reported_at/type", keyword: "type", params: { type: schema31.properties.manual_notice_reported_at.type }, message: "must be string,null" };
        if (vErrors === null) {
          vErrors = [err4];
        } else {
          vErrors.push(err4);
        }
        errors++;
      }
    }
    if (data.pause_reason !== void 0) {
      let data4 = data.pause_reason;
      if (typeof data4 !== "string" && data4 !== null) {
        const err5 = { instancePath: instancePath + "/pause_reason", schemaPath: "#/properties/pause_reason/type", keyword: "type", params: { type: schema31.properties.pause_reason.type }, message: "must be string,null" };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      }
    }
  } else {
    const err6 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err6];
    } else {
      vErrors.push(err6);
    }
    errors++;
  }
  validate20.errors = vErrors;
  return errors === 0;
}
validate20.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
exports.ApiFailure = validate21;
var schema32 = { "$id": "ApiFailure.json", "title": "ApiFailure", "description": "\uB9C1\uD06C\uAC00 \uB358\uC9C0\uB294 \uC624\uB958\uC758 \uB370\uC774\uD130 \uBAA8\uC591. \uC5C5\uBB34 \uCEF4\uD3EC\uB10C\uD2B8\uB294 \uD074\uB798\uC2A4\uB97C \uAC00\uC838\uC624\uC9C0 \uC54A\uACE0 name\uACFC \uC774 \uD544\uB4DC\uB9CC \uC77D\uB294\uB2E4.", "type": "object", "properties": { "name": { "enum": ["ApiError", "CallStaffError", "AbortedError", "BadBodyError"] }, "status": { "type": "integer", "minimum": 100, "maximum": 599, "description": "ApiError\uB9CC" }, "code": { "type": ["string", "null"], "description": "ApiError: \uC624\uB958 \uBCF8\uBB38 code. 413\xB7414\xB7431\uC740 INVALID_RECORD" }, "reason": { "type": ["string", "null"], "description": "ApiError: \uBCF8\uBB38 details.reason" }, "retryAfterMs": { "type": ["integer", "null"], "minimum": 0 }, "auth": { "type": "boolean", "description": "ApiError\uB9CC: 401\xB7403(\uC778\uC99D \uAC70\uBD80). \uACF5\uAC1C API \uADDC\uC57D(PUBLIC_API.md)\uC758 \uC0C1\uD0DC \uD574\uC11D\uC740 \uB9C1\uD06C \uD55C \uACF3\uC774 \uD558\uACE0, \uC5C5\uBB34 \uCEF4\uD3EC\uB10C\uD2B8\uC640 \uD654\uBA74\uC740 \uC774 \uAC12\uC744 \uC77D\uB294\uB2E4" }, "attempts": { "type": "integer", "minimum": 1, "description": "CallStaffError\uB9CC" } }, "required": ["name"], "additionalProperties": false, "allOf": [{ "if": { "properties": { "name": { "const": "ApiError" } } }, "then": { "required": ["status", "code", "reason", "retryAfterMs", "auth"] } }, { "if": { "properties": { "name": { "const": "CallStaffError" } } }, "then": { "required": ["attempts"] } }] };
function validate21(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  ;
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate21.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  const _errs2 = errors;
  let valid1 = true;
  const _errs3 = errors;
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.name !== void 0) {
      if ("ApiError" !== data.name) {
        const err0 = {};
        if (vErrors === null) {
          vErrors = [err0];
        } else {
          vErrors.push(err0);
        }
        errors++;
      }
    }
  }
  var _valid0 = _errs3 === errors;
  errors = _errs2;
  if (vErrors !== null) {
    if (_errs2) {
      vErrors.length = _errs2;
    } else {
      vErrors = null;
    }
  }
  if (_valid0) {
    const _errs5 = errors;
    if (data && typeof data == "object" && !Array.isArray(data)) {
      if (data.status === void 0) {
        const err1 = { instancePath, schemaPath: "#/allOf/0/then/required", keyword: "required", params: { missingProperty: "status" }, message: "must have required property 'status'" };
        if (vErrors === null) {
          vErrors = [err1];
        } else {
          vErrors.push(err1);
        }
        errors++;
      }
      if (data.code === void 0) {
        const err2 = { instancePath, schemaPath: "#/allOf/0/then/required", keyword: "required", params: { missingProperty: "code" }, message: "must have required property 'code'" };
        if (vErrors === null) {
          vErrors = [err2];
        } else {
          vErrors.push(err2);
        }
        errors++;
      }
      if (data.reason === void 0) {
        const err3 = { instancePath, schemaPath: "#/allOf/0/then/required", keyword: "required", params: { missingProperty: "reason" }, message: "must have required property 'reason'" };
        if (vErrors === null) {
          vErrors = [err3];
        } else {
          vErrors.push(err3);
        }
        errors++;
      }
      if (data.retryAfterMs === void 0) {
        const err4 = { instancePath, schemaPath: "#/allOf/0/then/required", keyword: "required", params: { missingProperty: "retryAfterMs" }, message: "must have required property 'retryAfterMs'" };
        if (vErrors === null) {
          vErrors = [err4];
        } else {
          vErrors.push(err4);
        }
        errors++;
      }
      if (data.auth === void 0) {
        const err5 = { instancePath, schemaPath: "#/allOf/0/then/required", keyword: "required", params: { missingProperty: "auth" }, message: "must have required property 'auth'" };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      }
    }
    var _valid0 = _errs5 === errors;
    valid1 = _valid0;
  }
  if (!valid1) {
    const err6 = { instancePath, schemaPath: "#/allOf/0/if", keyword: "if", params: { failingKeyword: "then" }, message: 'must match "then" schema' };
    if (vErrors === null) {
      vErrors = [err6];
    } else {
      vErrors.push(err6);
    }
    errors++;
  }
  const _errs7 = errors;
  let valid3 = true;
  const _errs8 = errors;
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.name !== void 0) {
      if ("CallStaffError" !== data.name) {
        const err7 = {};
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
    }
  }
  var _valid1 = _errs8 === errors;
  errors = _errs7;
  if (vErrors !== null) {
    if (_errs7) {
      vErrors.length = _errs7;
    } else {
      vErrors = null;
    }
  }
  if (_valid1) {
    const _errs10 = errors;
    if (data && typeof data == "object" && !Array.isArray(data)) {
      if (data.attempts === void 0) {
        const err8 = { instancePath, schemaPath: "#/allOf/1/then/required", keyword: "required", params: { missingProperty: "attempts" }, message: "must have required property 'attempts'" };
        if (vErrors === null) {
          vErrors = [err8];
        } else {
          vErrors.push(err8);
        }
        errors++;
      }
    }
    var _valid1 = _errs10 === errors;
    valid3 = _valid1;
  }
  if (!valid3) {
    const err9 = { instancePath, schemaPath: "#/allOf/1/if", keyword: "if", params: { failingKeyword: "then" }, message: 'must match "then" schema' };
    if (vErrors === null) {
      vErrors = [err9];
    } else {
      vErrors.push(err9);
    }
    errors++;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.name === void 0) {
      const err10 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "name" }, message: "must have required property 'name'" };
      if (vErrors === null) {
        vErrors = [err10];
      } else {
        vErrors.push(err10);
      }
      errors++;
    }
    for (const key0 in data) {
      if (!(key0 === "name" || key0 === "status" || key0 === "code" || key0 === "reason" || key0 === "retryAfterMs" || key0 === "auth" || key0 === "attempts")) {
        const err11 = { instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
        if (vErrors === null) {
          vErrors = [err11];
        } else {
          vErrors.push(err11);
        }
        errors++;
      }
    }
    if (data.name !== void 0) {
      let data2 = data.name;
      if (!(data2 === "ApiError" || data2 === "CallStaffError" || data2 === "AbortedError" || data2 === "BadBodyError")) {
        const err12 = { instancePath: instancePath + "/name", schemaPath: "#/properties/name/enum", keyword: "enum", params: { allowedValues: schema32.properties.name.enum }, message: "must be equal to one of the allowed values" };
        if (vErrors === null) {
          vErrors = [err12];
        } else {
          vErrors.push(err12);
        }
        errors++;
      }
    }
    if (data.status !== void 0) {
      let data3 = data.status;
      if (!(typeof data3 == "number" && (!(data3 % 1) && !isNaN(data3)))) {
        const err13 = { instancePath: instancePath + "/status", schemaPath: "#/properties/status/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
        if (vErrors === null) {
          vErrors = [err13];
        } else {
          vErrors.push(err13);
        }
        errors++;
      }
      if (typeof data3 == "number") {
        if (data3 > 599 || isNaN(data3)) {
          const err14 = { instancePath: instancePath + "/status", schemaPath: "#/properties/status/maximum", keyword: "maximum", params: { comparison: "<=", limit: 599 }, message: "must be <= 599" };
          if (vErrors === null) {
            vErrors = [err14];
          } else {
            vErrors.push(err14);
          }
          errors++;
        }
        if (data3 < 100 || isNaN(data3)) {
          const err15 = { instancePath: instancePath + "/status", schemaPath: "#/properties/status/minimum", keyword: "minimum", params: { comparison: ">=", limit: 100 }, message: "must be >= 100" };
          if (vErrors === null) {
            vErrors = [err15];
          } else {
            vErrors.push(err15);
          }
          errors++;
        }
      }
    }
    if (data.code !== void 0) {
      let data4 = data.code;
      if (typeof data4 !== "string" && data4 !== null) {
        const err16 = { instancePath: instancePath + "/code", schemaPath: "#/properties/code/type", keyword: "type", params: { type: schema32.properties.code.type }, message: "must be string,null" };
        if (vErrors === null) {
          vErrors = [err16];
        } else {
          vErrors.push(err16);
        }
        errors++;
      }
    }
    if (data.reason !== void 0) {
      let data5 = data.reason;
      if (typeof data5 !== "string" && data5 !== null) {
        const err17 = { instancePath: instancePath + "/reason", schemaPath: "#/properties/reason/type", keyword: "type", params: { type: schema32.properties.reason.type }, message: "must be string,null" };
        if (vErrors === null) {
          vErrors = [err17];
        } else {
          vErrors.push(err17);
        }
        errors++;
      }
    }
    if (data.retryAfterMs !== void 0) {
      let data6 = data.retryAfterMs;
      if (!(typeof data6 == "number" && (!(data6 % 1) && !isNaN(data6))) && data6 !== null) {
        const err18 = { instancePath: instancePath + "/retryAfterMs", schemaPath: "#/properties/retryAfterMs/type", keyword: "type", params: { type: schema32.properties.retryAfterMs.type }, message: "must be integer,null" };
        if (vErrors === null) {
          vErrors = [err18];
        } else {
          vErrors.push(err18);
        }
        errors++;
      }
      if (typeof data6 == "number") {
        if (data6 < 0 || isNaN(data6)) {
          const err19 = { instancePath: instancePath + "/retryAfterMs", schemaPath: "#/properties/retryAfterMs/minimum", keyword: "minimum", params: { comparison: ">=", limit: 0 }, message: "must be >= 0" };
          if (vErrors === null) {
            vErrors = [err19];
          } else {
            vErrors.push(err19);
          }
          errors++;
        }
      }
    }
    if (data.auth !== void 0) {
      if (typeof data.auth !== "boolean") {
        const err20 = { instancePath: instancePath + "/auth", schemaPath: "#/properties/auth/type", keyword: "type", params: { type: "boolean" }, message: "must be boolean" };
        if (vErrors === null) {
          vErrors = [err20];
        } else {
          vErrors.push(err20);
        }
        errors++;
      }
    }
    if (data.attempts !== void 0) {
      let data8 = data.attempts;
      if (!(typeof data8 == "number" && (!(data8 % 1) && !isNaN(data8)))) {
        const err21 = { instancePath: instancePath + "/attempts", schemaPath: "#/properties/attempts/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
        if (vErrors === null) {
          vErrors = [err21];
        } else {
          vErrors.push(err21);
        }
        errors++;
      }
      if (typeof data8 == "number") {
        if (data8 < 1 || isNaN(data8)) {
          const err22 = { instancePath: instancePath + "/attempts", schemaPath: "#/properties/attempts/minimum", keyword: "minimum", params: { comparison: ">=", limit: 1 }, message: "must be >= 1" };
          if (vErrors === null) {
            vErrors = [err22];
          } else {
            vErrors.push(err22);
          }
          errors++;
        }
      }
    }
  } else {
    const err23 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err23];
    } else {
      vErrors.push(err23);
    }
    errors++;
  }
  validate21.errors = vErrors;
  return errors === 0;
}
validate21.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
exports.ChatBubble = validate22;
var schema33 = { "$id": "ChatBubble.json", "title": "ChatBubble", "description": "\uB9D0\uD48D\uC120 \uD558\uB098.", "type": "object", "properties": { "id": { "type": "string", "minLength": 1 }, "speaker": { "enum": ["patient", "system"] }, "text": { "type": "string", "pattern": "\\S" } }, "required": ["id", "speaker", "text"], "additionalProperties": false };
var func1 = require_ucs2length().default;
var pattern4 = new RegExp("\\S", "u");
function validate22(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  ;
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate22.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.id === void 0) {
      const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "id" }, message: "must have required property 'id'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.speaker === void 0) {
      const err1 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "speaker" }, message: "must have required property 'speaker'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.text === void 0) {
      const err2 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "text" }, message: "must have required property 'text'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    for (const key0 in data) {
      if (!(key0 === "id" || key0 === "speaker" || key0 === "text")) {
        const err3 = { instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
        if (vErrors === null) {
          vErrors = [err3];
        } else {
          vErrors.push(err3);
        }
        errors++;
      }
    }
    if (data.id !== void 0) {
      let data0 = data.id;
      if (typeof data0 === "string") {
        if (func1(data0) < 1) {
          const err4 = { instancePath: instancePath + "/id", schemaPath: "#/properties/id/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" };
          if (vErrors === null) {
            vErrors = [err4];
          } else {
            vErrors.push(err4);
          }
          errors++;
        }
      } else {
        const err5 = { instancePath: instancePath + "/id", schemaPath: "#/properties/id/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      }
    }
    if (data.speaker !== void 0) {
      let data1 = data.speaker;
      if (!(data1 === "patient" || data1 === "system")) {
        const err6 = { instancePath: instancePath + "/speaker", schemaPath: "#/properties/speaker/enum", keyword: "enum", params: { allowedValues: schema33.properties.speaker.enum }, message: "must be equal to one of the allowed values" };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
    if (data.text !== void 0) {
      let data2 = data.text;
      if (typeof data2 === "string") {
        if (!pattern4.test(data2)) {
          const err7 = { instancePath: instancePath + "/text", schemaPath: "#/properties/text/pattern", keyword: "pattern", params: { pattern: "\\S" }, message: 'must match pattern "\\S"' };
          if (vErrors === null) {
            vErrors = [err7];
          } else {
            vErrors.push(err7);
          }
          errors++;
        }
      } else {
        const err8 = { instancePath: instancePath + "/text", schemaPath: "#/properties/text/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err8];
        } else {
          vErrors.push(err8);
        }
        errors++;
      }
    }
  } else {
    const err9 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err9];
    } else {
      vErrors.push(err9);
    }
    errors++;
  }
  validate22.errors = vErrors;
  return errors === 0;
}
validate22.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
exports.ChatView = validate23;
function validate23(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  ;
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate23.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.bubbles === void 0) {
      const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "bubbles" }, message: "must have required property 'bubbles'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    for (const key0 in data) {
      if (!(key0 === "bubbles")) {
        const err1 = { instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
        if (vErrors === null) {
          vErrors = [err1];
        } else {
          vErrors.push(err1);
        }
        errors++;
      }
    }
    if (data.bubbles !== void 0) {
      let data0 = data.bubbles;
      if (Array.isArray(data0)) {
        if (data0.length > 100) {
          const err2 = { instancePath: instancePath + "/bubbles", schemaPath: "#/properties/bubbles/maxItems", keyword: "maxItems", params: { limit: 100 }, message: "must NOT have more than 100 items" };
          if (vErrors === null) {
            vErrors = [err2];
          } else {
            vErrors.push(err2);
          }
          errors++;
        }
        const len0 = data0.length;
        for (let i0 = 0; i0 < len0; i0++) {
          let data1 = data0[i0];
          if (data1 && typeof data1 == "object" && !Array.isArray(data1)) {
            if (data1.id === void 0) {
              const err3 = { instancePath: instancePath + "/bubbles/" + i0, schemaPath: "ChatBubble.json/required", keyword: "required", params: { missingProperty: "id" }, message: "must have required property 'id'" };
              if (vErrors === null) {
                vErrors = [err3];
              } else {
                vErrors.push(err3);
              }
              errors++;
            }
            if (data1.speaker === void 0) {
              const err4 = { instancePath: instancePath + "/bubbles/" + i0, schemaPath: "ChatBubble.json/required", keyword: "required", params: { missingProperty: "speaker" }, message: "must have required property 'speaker'" };
              if (vErrors === null) {
                vErrors = [err4];
              } else {
                vErrors.push(err4);
              }
              errors++;
            }
            if (data1.text === void 0) {
              const err5 = { instancePath: instancePath + "/bubbles/" + i0, schemaPath: "ChatBubble.json/required", keyword: "required", params: { missingProperty: "text" }, message: "must have required property 'text'" };
              if (vErrors === null) {
                vErrors = [err5];
              } else {
                vErrors.push(err5);
              }
              errors++;
            }
            for (const key1 in data1) {
              if (!(key1 === "id" || key1 === "speaker" || key1 === "text")) {
                const err6 = { instancePath: instancePath + "/bubbles/" + i0, schemaPath: "ChatBubble.json/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key1 }, message: "must NOT have additional properties" };
                if (vErrors === null) {
                  vErrors = [err6];
                } else {
                  vErrors.push(err6);
                }
                errors++;
              }
            }
            if (data1.id !== void 0) {
              let data2 = data1.id;
              if (typeof data2 === "string") {
                if (func1(data2) < 1) {
                  const err7 = { instancePath: instancePath + "/bubbles/" + i0 + "/id", schemaPath: "ChatBubble.json/properties/id/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" };
                  if (vErrors === null) {
                    vErrors = [err7];
                  } else {
                    vErrors.push(err7);
                  }
                  errors++;
                }
              } else {
                const err8 = { instancePath: instancePath + "/bubbles/" + i0 + "/id", schemaPath: "ChatBubble.json/properties/id/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                if (vErrors === null) {
                  vErrors = [err8];
                } else {
                  vErrors.push(err8);
                }
                errors++;
              }
            }
            if (data1.speaker !== void 0) {
              let data3 = data1.speaker;
              if (!(data3 === "patient" || data3 === "system")) {
                const err9 = { instancePath: instancePath + "/bubbles/" + i0 + "/speaker", schemaPath: "ChatBubble.json/properties/speaker/enum", keyword: "enum", params: { allowedValues: schema33.properties.speaker.enum }, message: "must be equal to one of the allowed values" };
                if (vErrors === null) {
                  vErrors = [err9];
                } else {
                  vErrors.push(err9);
                }
                errors++;
              }
            }
            if (data1.text !== void 0) {
              let data4 = data1.text;
              if (typeof data4 === "string") {
                if (!pattern4.test(data4)) {
                  const err10 = { instancePath: instancePath + "/bubbles/" + i0 + "/text", schemaPath: "ChatBubble.json/properties/text/pattern", keyword: "pattern", params: { pattern: "\\S" }, message: 'must match pattern "\\S"' };
                  if (vErrors === null) {
                    vErrors = [err10];
                  } else {
                    vErrors.push(err10);
                  }
                  errors++;
                }
              } else {
                const err11 = { instancePath: instancePath + "/bubbles/" + i0 + "/text", schemaPath: "ChatBubble.json/properties/text/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                if (vErrors === null) {
                  vErrors = [err11];
                } else {
                  vErrors.push(err11);
                }
                errors++;
              }
            }
          } else {
            const err12 = { instancePath: instancePath + "/bubbles/" + i0, schemaPath: "ChatBubble.json/type", keyword: "type", params: { type: "object" }, message: "must be object" };
            if (vErrors === null) {
              vErrors = [err12];
            } else {
              vErrors.push(err12);
            }
            errors++;
          }
        }
      } else {
        const err13 = { instancePath: instancePath + "/bubbles", schemaPath: "#/properties/bubbles/type", keyword: "type", params: { type: "array" }, message: "must be array" };
        if (vErrors === null) {
          vErrors = [err13];
        } else {
          vErrors.push(err13);
        }
        errors++;
      }
    }
  } else {
    const err14 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err14];
    } else {
      vErrors.push(err14);
    }
    errors++;
  }
  validate23.errors = vErrors;
  return errors === 0;
}
validate23.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
exports.ConversationEvent = validate24;
var schema36 = { "$id": "ConversationEvent.json", "title": "ConversationEvent", "description": "\uB300\uD654 \uBAA9\uB85D\uC758 \uC785\uB825 \uC774\uBCA4\uD2B8. id\uB294 \uAC19\uC740 \uB9D0\uD48D\uC120\uC744 \uB450 \uBC88 \uB9CC\uB4E4\uC9C0 \uC54A\uAE30 \uC704\uD55C \uD0A4(\uAC19\uC740 turn_id\uC758 \uC7AC\uC804\uC1A1).", "oneOf": [{ "type": "object", "properties": { "type": { "enum": ["PATIENT", "SYSTEM"] }, "id": { "type": "string", "minLength": 1 }, "text": { "type": "string", "pattern": "\\S" } }, "required": ["type", "id", "text"], "additionalProperties": false }, { "type": "object", "properties": { "type": { "const": "CLEAR" } }, "required": ["type"], "additionalProperties": false }] };
function validate24(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  ;
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate24.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  const _errs0 = errors;
  let valid0 = false;
  let passing0 = null;
  const _errs1 = errors;
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.type === void 0) {
      const err0 = { instancePath, schemaPath: "#/oneOf/0/required", keyword: "required", params: { missingProperty: "type" }, message: "must have required property 'type'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.id === void 0) {
      const err1 = { instancePath, schemaPath: "#/oneOf/0/required", keyword: "required", params: { missingProperty: "id" }, message: "must have required property 'id'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.text === void 0) {
      const err2 = { instancePath, schemaPath: "#/oneOf/0/required", keyword: "required", params: { missingProperty: "text" }, message: "must have required property 'text'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    for (const key0 in data) {
      if (!(key0 === "type" || key0 === "id" || key0 === "text")) {
        const err3 = { instancePath, schemaPath: "#/oneOf/0/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
        if (vErrors === null) {
          vErrors = [err3];
        } else {
          vErrors.push(err3);
        }
        errors++;
      }
    }
    if (data.type !== void 0) {
      let data0 = data.type;
      if (!(data0 === "PATIENT" || data0 === "SYSTEM")) {
        const err4 = { instancePath: instancePath + "/type", schemaPath: "#/oneOf/0/properties/type/enum", keyword: "enum", params: { allowedValues: schema36.oneOf[0].properties.type.enum }, message: "must be equal to one of the allowed values" };
        if (vErrors === null) {
          vErrors = [err4];
        } else {
          vErrors.push(err4);
        }
        errors++;
      }
    }
    if (data.id !== void 0) {
      let data1 = data.id;
      if (typeof data1 === "string") {
        if (func1(data1) < 1) {
          const err5 = { instancePath: instancePath + "/id", schemaPath: "#/oneOf/0/properties/id/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" };
          if (vErrors === null) {
            vErrors = [err5];
          } else {
            vErrors.push(err5);
          }
          errors++;
        }
      } else {
        const err6 = { instancePath: instancePath + "/id", schemaPath: "#/oneOf/0/properties/id/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
    if (data.text !== void 0) {
      let data2 = data.text;
      if (typeof data2 === "string") {
        if (!pattern4.test(data2)) {
          const err7 = { instancePath: instancePath + "/text", schemaPath: "#/oneOf/0/properties/text/pattern", keyword: "pattern", params: { pattern: "\\S" }, message: 'must match pattern "\\S"' };
          if (vErrors === null) {
            vErrors = [err7];
          } else {
            vErrors.push(err7);
          }
          errors++;
        }
      } else {
        const err8 = { instancePath: instancePath + "/text", schemaPath: "#/oneOf/0/properties/text/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err8];
        } else {
          vErrors.push(err8);
        }
        errors++;
      }
    }
  } else {
    const err9 = { instancePath, schemaPath: "#/oneOf/0/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err9];
    } else {
      vErrors.push(err9);
    }
    errors++;
  }
  var _valid0 = _errs1 === errors;
  if (_valid0) {
    valid0 = true;
    passing0 = 0;
    var props0 = true;
  }
  const _errs9 = errors;
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.type === void 0) {
      const err10 = { instancePath, schemaPath: "#/oneOf/1/required", keyword: "required", params: { missingProperty: "type" }, message: "must have required property 'type'" };
      if (vErrors === null) {
        vErrors = [err10];
      } else {
        vErrors.push(err10);
      }
      errors++;
    }
    for (const key1 in data) {
      if (!(key1 === "type")) {
        const err11 = { instancePath, schemaPath: "#/oneOf/1/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key1 }, message: "must NOT have additional properties" };
        if (vErrors === null) {
          vErrors = [err11];
        } else {
          vErrors.push(err11);
        }
        errors++;
      }
    }
    if (data.type !== void 0) {
      if ("CLEAR" !== data.type) {
        const err12 = { instancePath: instancePath + "/type", schemaPath: "#/oneOf/1/properties/type/const", keyword: "const", params: { allowedValue: "CLEAR" }, message: "must be equal to constant" };
        if (vErrors === null) {
          vErrors = [err12];
        } else {
          vErrors.push(err12);
        }
        errors++;
      }
    }
  } else {
    const err13 = { instancePath, schemaPath: "#/oneOf/1/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err13];
    } else {
      vErrors.push(err13);
    }
    errors++;
  }
  var _valid0 = _errs9 === errors;
  if (_valid0 && valid0) {
    valid0 = false;
    passing0 = [passing0, 1];
  } else {
    if (_valid0) {
      valid0 = true;
      passing0 = 1;
      if (props0 !== true) {
        props0 = true;
      }
    }
  }
  if (!valid0) {
    const err14 = { instancePath, schemaPath: "#/oneOf", keyword: "oneOf", params: { passingSchemas: passing0 }, message: "must match exactly one schema in oneOf" };
    if (vErrors === null) {
      vErrors = [err14];
    } else {
      vErrors.push(err14);
    }
    errors++;
  } else {
    errors = _errs0;
    if (vErrors !== null) {
      if (_errs0) {
        vErrors.length = _errs0;
      } else {
        vErrors = null;
      }
    }
  }
  validate24.errors = vErrors;
  evaluated0.props = props0;
  return errors === 0;
}
validate24.evaluated = { "dynamicProps": true, "dynamicItems": false };
exports.DecisionRequest = validate25;
var schema37 = { "$id": "DecisionRequest.json", "title": "DecisionRequest", "description": "\uC9C1\uC6D0\uC758 \uAC1C\uC785 \uACB0\uC815 \uC785\uB825(\uD655\uC778 \uB2E8\uACC4\uB97C \uAC70\uCE5C\uB2E4). \uAC19\uC740 \uC54C\uB9BC\xB7\uAC19\uC740 \uACB0\uC815\uC740 \uAC19\uC740 turn_id\uB85C \uAC04\uB2E4.", "type": "object", "properties": { "alert_id": { "type": "string", "minLength": 1 }, "session_id": { "$ref": "SessionState.schema.json#/properties/session_id" }, "decision": { "enum": ["RESUME", "END"] } }, "required": ["alert_id", "session_id", "decision"], "additionalProperties": false };
var pattern7 = new RegExp("^[A-Za-z0-9][A-Za-z0-9._:-]*$(?![\\s\\S])", "u");
var pattern8 = new RegExp("^[A-Za-z0-9_-]*$(?![\\s\\S])", "u");
function validate30(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate30.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (typeof data === "string") {
    if (func1(data) > 128) {
      const err0 = { instancePath, schemaPath: "#/$defs/Id/maxLength", keyword: "maxLength", params: { limit: 128 }, message: "must NOT have more than 128 characters" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (func1(data) < 1) {
      const err1 = { instancePath, schemaPath: "#/$defs/Id/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (!pattern7.test(data)) {
      const err2 = { instancePath, schemaPath: "#/$defs/Id/pattern", keyword: "pattern", params: { pattern: "^[A-Za-z0-9][A-Za-z0-9._:-]*$(?![\\s\\S])" }, message: 'must match pattern "^[A-Za-z0-9][A-Za-z0-9._:-]*$(?![\\s\\S])"' };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
  } else {
    const err3 = { instancePath, schemaPath: "#/$defs/Id/type", keyword: "type", params: { type: "string" }, message: "must be string" };
    if (vErrors === null) {
      vErrors = [err3];
    } else {
      vErrors.push(err3);
    }
    errors++;
  }
  if (typeof data === "string") {
    if (func1(data) > 64) {
      const err4 = { instancePath, schemaPath: "#/maxLength", keyword: "maxLength", params: { limit: 64 }, message: "must NOT have more than 64 characters" };
      if (vErrors === null) {
        vErrors = [err4];
      } else {
        vErrors.push(err4);
      }
      errors++;
    }
    if (!pattern8.test(data)) {
      const err5 = { instancePath, schemaPath: "#/pattern", keyword: "pattern", params: { pattern: "^[A-Za-z0-9_-]*$(?![\\s\\S])" }, message: 'must match pattern "^[A-Za-z0-9_-]*$(?![\\s\\S])"' };
      if (vErrors === null) {
        vErrors = [err5];
      } else {
        vErrors.push(err5);
      }
      errors++;
    }
  }
  validate30.errors = vErrors;
  return errors === 0;
}
validate30.evaluated = { "dynamicProps": false, "dynamicItems": false };
function validate25(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  ;
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate25.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.alert_id === void 0) {
      const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "alert_id" }, message: "must have required property 'alert_id'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.session_id === void 0) {
      const err1 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "session_id" }, message: "must have required property 'session_id'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.decision === void 0) {
      const err2 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "decision" }, message: "must have required property 'decision'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    for (const key0 in data) {
      if (!(key0 === "alert_id" || key0 === "session_id" || key0 === "decision")) {
        const err3 = { instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
        if (vErrors === null) {
          vErrors = [err3];
        } else {
          vErrors.push(err3);
        }
        errors++;
      }
    }
    if (data.alert_id !== void 0) {
      let data0 = data.alert_id;
      if (typeof data0 === "string") {
        if (func1(data0) < 1) {
          const err4 = { instancePath: instancePath + "/alert_id", schemaPath: "#/properties/alert_id/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" };
          if (vErrors === null) {
            vErrors = [err4];
          } else {
            vErrors.push(err4);
          }
          errors++;
        }
      } else {
        const err5 = { instancePath: instancePath + "/alert_id", schemaPath: "#/properties/alert_id/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      }
    }
    if (data.session_id !== void 0) {
      if (!validate30(data.session_id, { instancePath: instancePath + "/session_id", parentData: data, parentDataProperty: "session_id", rootData, dynamicAnchors })) {
        vErrors = vErrors === null ? validate30.errors : vErrors.concat(validate30.errors);
        errors = vErrors.length;
      }
    }
    if (data.decision !== void 0) {
      let data2 = data.decision;
      if (!(data2 === "RESUME" || data2 === "END")) {
        const err6 = { instancePath: instancePath + "/decision", schemaPath: "#/properties/decision/enum", keyword: "enum", params: { allowedValues: schema37.properties.decision.enum }, message: "must be equal to one of the allowed values" };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
  } else {
    const err7 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err7];
    } else {
      vErrors.push(err7);
    }
    errors++;
  }
  validate25.errors = vErrors;
  return errors === 0;
}
validate25.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
exports.InterventionRequest = validate32;
var schema44 = { "$id": "InterventionRequest.json", "title": "InterventionRequest", "description": "\uC9C1\uC6D0\uC758 \uAC1C\uC785 \uACB0\uC815 \uC804\uC1A1 \uC785\uB825.", "type": "object", "properties": { "session_id": { "$ref": "SessionState.schema.json#/properties/session_id" }, "decision": { "enum": ["RESUME", "END"] }, "turn_id": { "$ref": "StaffCallReport.schema.json#/properties/turn_id" } }, "required": ["session_id", "decision", "turn_id"], "additionalProperties": false };
function validate33(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate33.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (typeof data === "string") {
    if (func1(data) > 128) {
      const err0 = { instancePath, schemaPath: "#/$defs/Id/maxLength", keyword: "maxLength", params: { limit: 128 }, message: "must NOT have more than 128 characters" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (func1(data) < 1) {
      const err1 = { instancePath, schemaPath: "#/$defs/Id/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (!pattern7.test(data)) {
      const err2 = { instancePath, schemaPath: "#/$defs/Id/pattern", keyword: "pattern", params: { pattern: "^[A-Za-z0-9][A-Za-z0-9._:-]*$(?![\\s\\S])" }, message: 'must match pattern "^[A-Za-z0-9][A-Za-z0-9._:-]*$(?![\\s\\S])"' };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
  } else {
    const err3 = { instancePath, schemaPath: "#/$defs/Id/type", keyword: "type", params: { type: "string" }, message: "must be string" };
    if (vErrors === null) {
      vErrors = [err3];
    } else {
      vErrors.push(err3);
    }
    errors++;
  }
  if (typeof data === "string") {
    if (func1(data) > 64) {
      const err4 = { instancePath, schemaPath: "#/maxLength", keyword: "maxLength", params: { limit: 64 }, message: "must NOT have more than 64 characters" };
      if (vErrors === null) {
        vErrors = [err4];
      } else {
        vErrors.push(err4);
      }
      errors++;
    }
    if (!pattern8.test(data)) {
      const err5 = { instancePath, schemaPath: "#/pattern", keyword: "pattern", params: { pattern: "^[A-Za-z0-9_-]*$(?![\\s\\S])" }, message: 'must match pattern "^[A-Za-z0-9_-]*$(?![\\s\\S])"' };
      if (vErrors === null) {
        vErrors = [err5];
      } else {
        vErrors.push(err5);
      }
      errors++;
    }
  }
  validate33.errors = vErrors;
  return errors === 0;
}
validate33.evaluated = { "dynamicProps": false, "dynamicItems": false };
function validate32(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  ;
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate32.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.session_id === void 0) {
      const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "session_id" }, message: "must have required property 'session_id'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.decision === void 0) {
      const err1 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "decision" }, message: "must have required property 'decision'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.turn_id === void 0) {
      const err2 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "turn_id" }, message: "must have required property 'turn_id'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    for (const key0 in data) {
      if (!(key0 === "session_id" || key0 === "decision" || key0 === "turn_id")) {
        const err3 = { instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
        if (vErrors === null) {
          vErrors = [err3];
        } else {
          vErrors.push(err3);
        }
        errors++;
      }
    }
    if (data.session_id !== void 0) {
      if (!validate33(data.session_id, { instancePath: instancePath + "/session_id", parentData: data, parentDataProperty: "session_id", rootData, dynamicAnchors })) {
        vErrors = vErrors === null ? validate33.errors : vErrors.concat(validate33.errors);
        errors = vErrors.length;
      }
    }
    if (data.decision !== void 0) {
      let data1 = data.decision;
      if (!(data1 === "RESUME" || data1 === "END")) {
        const err4 = { instancePath: instancePath + "/decision", schemaPath: "#/properties/decision/enum", keyword: "enum", params: { allowedValues: schema44.properties.decision.enum }, message: "must be equal to one of the allowed values" };
        if (vErrors === null) {
          vErrors = [err4];
        } else {
          vErrors.push(err4);
        }
        errors++;
      }
    }
    if (data.turn_id !== void 0) {
      let data2 = data.turn_id;
      if (typeof data2 === "string") {
        if (func1(data2) > 128) {
          const err5 = { instancePath: instancePath + "/turn_id", schemaPath: "StaffCallReport.schema.json#/properties/turn_id/maxLength", keyword: "maxLength", params: { limit: 128 }, message: "must NOT have more than 128 characters" };
          if (vErrors === null) {
            vErrors = [err5];
          } else {
            vErrors.push(err5);
          }
          errors++;
        }
        if (func1(data2) < 1) {
          const err6 = { instancePath: instancePath + "/turn_id", schemaPath: "StaffCallReport.schema.json#/properties/turn_id/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" };
          if (vErrors === null) {
            vErrors = [err6];
          } else {
            vErrors.push(err6);
          }
          errors++;
        }
        if (!pattern7.test(data2)) {
          const err7 = { instancePath: instancePath + "/turn_id", schemaPath: "StaffCallReport.schema.json#/properties/turn_id/pattern", keyword: "pattern", params: { pattern: "^[A-Za-z0-9][A-Za-z0-9._:-]*$(?![\\s\\S])" }, message: 'must match pattern "^[A-Za-z0-9][A-Za-z0-9._:-]*$(?![\\s\\S])"' };
          if (vErrors === null) {
            vErrors = [err7];
          } else {
            vErrors.push(err7);
          }
          errors++;
        }
      } else {
        const err8 = { instancePath: instancePath + "/turn_id", schemaPath: "StaffCallReport.schema.json#/properties/turn_id/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err8];
        } else {
          vErrors.push(err8);
        }
        errors++;
      }
    }
  } else {
    const err9 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err9];
    } else {
      vErrors.push(err9);
    }
    errors++;
  }
  validate32.errors = vErrors;
  return errors === 0;
}
validate32.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
exports.KioskStart = validate36;
var pattern16 = new RegExp("^[A-Za-z0-9._:/#=+-]{1,128}$(?![\\s\\S])", "u");
function validate36(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  ;
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate36.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.subjectRef === void 0) {
      const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "subjectRef" }, message: "must have required property 'subjectRef'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.subjectInvalid === void 0) {
      const err1 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "subjectInvalid" }, message: "must have required property 'subjectInvalid'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.questionSetId === void 0) {
      const err2 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "questionSetId" }, message: "must have required property 'questionSetId'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    for (const key0 in data) {
      if (!(key0 === "subjectRef" || key0 === "subjectInvalid" || key0 === "allowRemoteStt" || key0 === "questionSetId")) {
        const err3 = { instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
        if (vErrors === null) {
          vErrors = [err3];
        } else {
          vErrors.push(err3);
        }
        errors++;
      }
    }
    if (data.subjectRef !== void 0) {
      let data0 = data.subjectRef;
      const _errs3 = errors;
      let valid1 = false;
      const _errs4 = errors;
      if (typeof data0 === "string") {
        if (!pattern16.test(data0)) {
          const err4 = { instancePath: instancePath + "/subjectRef", schemaPath: "PublicApiRequests.schema.json#/$defs/SessionStartBody/properties/subject_ref/pattern", keyword: "pattern", params: { pattern: "^[A-Za-z0-9._:/#=+-]{1,128}$(?![\\s\\S])" }, message: 'must match pattern "^[A-Za-z0-9._:/#=+-]{1,128}$(?![\\s\\S])"' };
          if (vErrors === null) {
            vErrors = [err4];
          } else {
            vErrors.push(err4);
          }
          errors++;
        }
      } else {
        const err5 = { instancePath: instancePath + "/subjectRef", schemaPath: "PublicApiRequests.schema.json#/$defs/SessionStartBody/properties/subject_ref/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      }
      var _valid0 = _errs4 === errors;
      valid1 = valid1 || _valid0;
      const _errs7 = errors;
      if (data0 !== null) {
        const err6 = { instancePath: instancePath + "/subjectRef", schemaPath: "#/properties/subjectRef/anyOf/1/type", keyword: "type", params: { type: "null" }, message: "must be null" };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
      var _valid0 = _errs7 === errors;
      valid1 = valid1 || _valid0;
      if (!valid1) {
        const err7 = { instancePath: instancePath + "/subjectRef", schemaPath: "#/properties/subjectRef/anyOf", keyword: "anyOf", params: {}, message: "must match a schema in anyOf" };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      } else {
        errors = _errs3;
        if (vErrors !== null) {
          if (_errs3) {
            vErrors.length = _errs3;
          } else {
            vErrors = null;
          }
        }
      }
    }
    if (data.subjectInvalid !== void 0) {
      if (typeof data.subjectInvalid !== "boolean") {
        const err8 = { instancePath: instancePath + "/subjectInvalid", schemaPath: "#/properties/subjectInvalid/type", keyword: "type", params: { type: "boolean" }, message: "must be boolean" };
        if (vErrors === null) {
          vErrors = [err8];
        } else {
          vErrors.push(err8);
        }
        errors++;
      }
    }
    if (data.allowRemoteStt !== void 0) {
      if (true !== data.allowRemoteStt) {
        const err9 = { instancePath: instancePath + "/allowRemoteStt", schemaPath: "#/properties/allowRemoteStt/const", keyword: "const", params: { allowedValue: true }, message: "must be equal to constant" };
        if (vErrors === null) {
          vErrors = [err9];
        } else {
          vErrors.push(err9);
        }
        errors++;
      }
    }
    if (data.questionSetId !== void 0) {
      let data3 = data.questionSetId;
      const _errs13 = errors;
      let valid3 = false;
      const _errs14 = errors;
      if (typeof data3 === "string") {
        if (func1(data3) > 128) {
          const err10 = { instancePath: instancePath + "/questionSetId", schemaPath: "DeviceConfig.schema.json#/properties/question_set_id/maxLength", keyword: "maxLength", params: { limit: 128 }, message: "must NOT have more than 128 characters" };
          if (vErrors === null) {
            vErrors = [err10];
          } else {
            vErrors.push(err10);
          }
          errors++;
        }
        if (func1(data3) < 1) {
          const err11 = { instancePath: instancePath + "/questionSetId", schemaPath: "DeviceConfig.schema.json#/properties/question_set_id/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" };
          if (vErrors === null) {
            vErrors = [err11];
          } else {
            vErrors.push(err11);
          }
          errors++;
        }
        if (!pattern7.test(data3)) {
          const err12 = { instancePath: instancePath + "/questionSetId", schemaPath: "DeviceConfig.schema.json#/properties/question_set_id/pattern", keyword: "pattern", params: { pattern: "^[A-Za-z0-9][A-Za-z0-9._:-]*$(?![\\s\\S])" }, message: 'must match pattern "^[A-Za-z0-9][A-Za-z0-9._:-]*$(?![\\s\\S])"' };
          if (vErrors === null) {
            vErrors = [err12];
          } else {
            vErrors.push(err12);
          }
          errors++;
        }
      } else {
        const err13 = { instancePath: instancePath + "/questionSetId", schemaPath: "DeviceConfig.schema.json#/properties/question_set_id/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err13];
        } else {
          vErrors.push(err13);
        }
        errors++;
      }
      var _valid1 = _errs14 === errors;
      valid3 = valid3 || _valid1;
      const _errs17 = errors;
      if (data3 !== null) {
        const err14 = { instancePath: instancePath + "/questionSetId", schemaPath: "#/properties/questionSetId/anyOf/1/type", keyword: "type", params: { type: "null" }, message: "must be null" };
        if (vErrors === null) {
          vErrors = [err14];
        } else {
          vErrors.push(err14);
        }
        errors++;
      }
      var _valid1 = _errs17 === errors;
      valid3 = valid3 || _valid1;
      if (!valid3) {
        const err15 = { instancePath: instancePath + "/questionSetId", schemaPath: "#/properties/questionSetId/anyOf", keyword: "anyOf", params: {}, message: "must match a schema in anyOf" };
        if (vErrors === null) {
          vErrors = [err15];
        } else {
          vErrors.push(err15);
        }
        errors++;
      } else {
        errors = _errs13;
        if (vErrors !== null) {
          if (_errs13) {
            vErrors.length = _errs13;
          } else {
            vErrors = null;
          }
        }
      }
    }
  } else {
    const err16 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err16];
    } else {
      vErrors.push(err16);
    }
    errors++;
  }
  validate36.errors = vErrors;
  return errors === 0;
}
validate36.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
exports.KioskView = validate64;
var schema81 = { "$id": "KioskView.json", "title": "KioskView", "description": "\uD0A4\uC624\uC2A4\uD06C \uC0C1\uD0DC \uAE30\uACC4\uC758 \uCD9C\uB825(\uD654\uBA74\uC774 \uADF8\uB9AC\uB294 \uAC12). \uD658\uC790 \uBC1C\uD654\uB294 \uB2F4\uC9C0 \uC54A\uB294\uB2E4(text\uB294 \uC11C\uBC84 \uC751\uB2F5 \uBB38\uC7A5).", "type": "object", "properties": { "state": { "enum": ["IDLE", "CHOOSING", "NOT_OPEN", "STARTING", "LISTENING", "REPEAT_PROMPT", "SENDING", "WAITING_STAFF", "CALL_STAFF", "ENDING", "ENDED"] }, "text": { "type": ["string", "null"] }, "callStaffReason": { "enum": ["RETRY_EXHAUSTED", "DELIVERY_FAILED", "AUTH", "START_FAILED", "STAFF_REQUESTED", "BAD_SUBJECT_REF", "REPEAT_LIMIT"] }, "repeatReason": { "enum": ["EMPTY_STT", "TOO_LONG"] }, "retrying": { "type": "boolean" }, "waitHint": { "enum": ["THINKING", "PLEASE_WAIT"], "description": "SENDING \uB300\uAE30 \uC911 \uD654\uBA74 \uD53C\uB4DC\uBC31 \uB2E8\uACC4(D125, Nielsen): 1\uCD08 \uB4A4 THINKING(\uC9C4\uD589 \uD45C\uC2DC), 10\uCD08 \uB4A4 PLEASE_WAIT(\uC548\uB0B4 \uBB38\uAD6C). \uC5C6\uC73C\uBA74 \uC544\uC9C1 1\uCD08 \uC804" }, "idleWarnS": { "type": "integer", "minimum": 0, "description": "\uC720\uD734 \uB9CC\uB8CC \uACBD\uACE0 \uC911: \uB9CC\uB8CC\uAE4C\uC9C0 \uB0A8\uC740 \uCD08(WCAG 2.2.1)" }, "textFallback": { "type": "boolean" }, "startNotice": { "const": "NO_SUBJECT_REF" }, "waitNotice": { "enum": ["SERVER_UNREACHABLE", "LONG_WAIT"] }, "endFailed": { "type": "boolean" }, "confirmLeave": { "type": "boolean" }, "pauseReason": { "enum": ["RISK", "REASK_LIMIT", "OTHER"] }, "staffCall": { "$ref": "StaffCallView.json" }, "busy": { "type": "boolean" }, "choices": { "type": "array", "minItems": 1, "items": { "type": "object", "properties": { "id": { "$ref": "DeviceConfig.schema.json#/properties/question_set_id" }, "title": { "type": "string", "minLength": 1 } }, "required": ["id", "title"], "additionalProperties": false }, "description": "CHOOSING\uC5D0\uC11C \uACE0\uB97C \uBB38\uC9C4\uD45C(\uD65C\uC131 \uBAA9\uB85D\uC758 ID\xB7\uC81C\uBAA9)" } }, "required": ["state", "text"], "additionalProperties": false, "allOf": [{ "if": { "properties": { "state": { "const": "CALL_STAFF" } }, "required": ["state"] }, "then": { "required": ["callStaffReason"] } }, { "if": { "properties": { "state": { "const": "REPEAT_PROMPT" } }, "required": ["state"] }, "then": { "required": ["repeatReason"] } }, { "if": { "required": ["callStaffReason"] }, "then": { "properties": { "state": { "const": "CALL_STAFF" } } } }, { "if": { "required": ["staffCall"] }, "then": { "properties": { "state": { "const": "CALL_STAFF" } } } }, { "if": { "properties": { "state": { "const": "CHOOSING" } }, "required": ["state"] }, "then": { "required": ["choices"] } }, { "if": { "required": ["choices"] }, "then": { "properties": { "state": { "const": "CHOOSING" } } } }] };
var schema82 = { "$id": "StaffCallView.json", "title": "StaffCallView", "description": "\uC9C1\uC6D0 \uD638\uCD9C \uD654\uBA74\uC758 '\uB2E4\uC2DC \uBD80\uB974\uAE30' \uC0C1\uD0DC. \uC5C6\uC73C\uBA74(\uC61B \uC11C\uBC84) \uAE30\uB2A5 \uC5C6\uC74C.", "type": "object", "properties": { "canRetry": { "type": "boolean" }, "sending": { "type": "boolean" }, "waitS": { "type": "integer", "minimum": 0, "description": "\uC11C\uBC84\uAC00 \uC900 retry_after_s\uB85C\uB9CC \uC815\uD55C\uB2E4" }, "attempts": { "type": "integer", "minimum": 0 }, "notice": { "enum": ["NO_ALERT", "STILL_FAILED", "NETWORK", "LIMIT", "UNSUPPORTED", "REPORT_FAILED", "AUTH", "BUSY", "READY"] } }, "required": ["canRetry", "sending", "waitS", "attempts"], "additionalProperties": false };
var func51 = Object.prototype.hasOwnProperty;
function validate64(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  ;
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate64.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  const _errs2 = errors;
  let valid1 = true;
  const _errs3 = errors;
  if (data && typeof data == "object" && !Array.isArray(data)) {
    let missing0;
    if (data.state === void 0 && (missing0 = "state")) {
      const err0 = {};
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    } else {
      if (data.state !== void 0) {
        if ("CALL_STAFF" !== data.state) {
          const err1 = {};
          if (vErrors === null) {
            vErrors = [err1];
          } else {
            vErrors.push(err1);
          }
          errors++;
        }
      }
    }
  }
  var _valid0 = _errs3 === errors;
  errors = _errs2;
  if (vErrors !== null) {
    if (_errs2) {
      vErrors.length = _errs2;
    } else {
      vErrors = null;
    }
  }
  if (_valid0) {
    const _errs5 = errors;
    if (data && typeof data == "object" && !Array.isArray(data)) {
      if (data.callStaffReason === void 0) {
        const err2 = { instancePath, schemaPath: "#/allOf/0/then/required", keyword: "required", params: { missingProperty: "callStaffReason" }, message: "must have required property 'callStaffReason'" };
        if (vErrors === null) {
          vErrors = [err2];
        } else {
          vErrors.push(err2);
        }
        errors++;
      }
    }
    var _valid0 = _errs5 === errors;
    valid1 = _valid0;
  }
  if (!valid1) {
    const err3 = { instancePath, schemaPath: "#/allOf/0/if", keyword: "if", params: { failingKeyword: "then" }, message: 'must match "then" schema' };
    if (vErrors === null) {
      vErrors = [err3];
    } else {
      vErrors.push(err3);
    }
    errors++;
  }
  const _errs7 = errors;
  let valid3 = true;
  const _errs8 = errors;
  if (data && typeof data == "object" && !Array.isArray(data)) {
    let missing1;
    if (data.state === void 0 && (missing1 = "state")) {
      const err4 = {};
      if (vErrors === null) {
        vErrors = [err4];
      } else {
        vErrors.push(err4);
      }
      errors++;
    } else {
      if (data.state !== void 0) {
        if ("REPEAT_PROMPT" !== data.state) {
          const err5 = {};
          if (vErrors === null) {
            vErrors = [err5];
          } else {
            vErrors.push(err5);
          }
          errors++;
        }
      }
    }
  }
  var _valid1 = _errs8 === errors;
  errors = _errs7;
  if (vErrors !== null) {
    if (_errs7) {
      vErrors.length = _errs7;
    } else {
      vErrors = null;
    }
  }
  if (_valid1) {
    const _errs10 = errors;
    if (data && typeof data == "object" && !Array.isArray(data)) {
      if (data.repeatReason === void 0) {
        const err6 = { instancePath, schemaPath: "#/allOf/1/then/required", keyword: "required", params: { missingProperty: "repeatReason" }, message: "must have required property 'repeatReason'" };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
    var _valid1 = _errs10 === errors;
    valid3 = _valid1;
  }
  if (!valid3) {
    const err7 = { instancePath, schemaPath: "#/allOf/1/if", keyword: "if", params: { failingKeyword: "then" }, message: 'must match "then" schema' };
    if (vErrors === null) {
      vErrors = [err7];
    } else {
      vErrors.push(err7);
    }
    errors++;
  }
  const _errs12 = errors;
  let valid5 = true;
  const _errs13 = errors;
  if (data && typeof data == "object" && !Array.isArray(data)) {
    let missing2;
    if (data.callStaffReason === void 0 && (missing2 = "callStaffReason")) {
      const err8 = {};
      if (vErrors === null) {
        vErrors = [err8];
      } else {
        vErrors.push(err8);
      }
      errors++;
    }
  }
  var _valid2 = _errs13 === errors;
  errors = _errs12;
  if (vErrors !== null) {
    if (_errs12) {
      vErrors.length = _errs12;
    } else {
      vErrors = null;
    }
  }
  if (_valid2) {
    const _errs14 = errors;
    if (data && typeof data == "object" && !Array.isArray(data)) {
      if (data.state !== void 0) {
        if ("CALL_STAFF" !== data.state) {
          const err9 = { instancePath: instancePath + "/state", schemaPath: "#/allOf/2/then/properties/state/const", keyword: "const", params: { allowedValue: "CALL_STAFF" }, message: "must be equal to constant" };
          if (vErrors === null) {
            vErrors = [err9];
          } else {
            vErrors.push(err9);
          }
          errors++;
        }
      }
    }
    var _valid2 = _errs14 === errors;
    valid5 = _valid2;
    if (valid5) {
      var props0 = {};
      props0.state = true;
    }
  }
  if (!valid5) {
    const err10 = { instancePath, schemaPath: "#/allOf/2/if", keyword: "if", params: { failingKeyword: "then" }, message: 'must match "then" schema' };
    if (vErrors === null) {
      vErrors = [err10];
    } else {
      vErrors.push(err10);
    }
    errors++;
  }
  if (props0 !== true) {
    props0 = props0 || {};
    props0.state = true;
  }
  const _errs17 = errors;
  let valid7 = true;
  const _errs18 = errors;
  if (data && typeof data == "object" && !Array.isArray(data)) {
    let missing3;
    if (data.staffCall === void 0 && (missing3 = "staffCall")) {
      const err11 = {};
      if (vErrors === null) {
        vErrors = [err11];
      } else {
        vErrors.push(err11);
      }
      errors++;
    }
  }
  var _valid3 = _errs18 === errors;
  errors = _errs17;
  if (vErrors !== null) {
    if (_errs17) {
      vErrors.length = _errs17;
    } else {
      vErrors = null;
    }
  }
  if (_valid3) {
    const _errs19 = errors;
    if (data && typeof data == "object" && !Array.isArray(data)) {
      if (data.state !== void 0) {
        if ("CALL_STAFF" !== data.state) {
          const err12 = { instancePath: instancePath + "/state", schemaPath: "#/allOf/3/then/properties/state/const", keyword: "const", params: { allowedValue: "CALL_STAFF" }, message: "must be equal to constant" };
          if (vErrors === null) {
            vErrors = [err12];
          } else {
            vErrors.push(err12);
          }
          errors++;
        }
      }
    }
    var _valid3 = _errs19 === errors;
    valid7 = _valid3;
    if (valid7) {
      var props1 = {};
      props1.state = true;
    }
  }
  if (!valid7) {
    const err13 = { instancePath, schemaPath: "#/allOf/3/if", keyword: "if", params: { failingKeyword: "then" }, message: 'must match "then" schema' };
    if (vErrors === null) {
      vErrors = [err13];
    } else {
      vErrors.push(err13);
    }
    errors++;
  }
  if (props0 !== true && props1 !== void 0) {
    if (props1 === true) {
      props0 = true;
    } else {
      props0 = props0 || {};
      Object.assign(props0, props1);
    }
  }
  const _errs22 = errors;
  let valid9 = true;
  const _errs23 = errors;
  if (data && typeof data == "object" && !Array.isArray(data)) {
    let missing4;
    if (data.state === void 0 && (missing4 = "state")) {
      const err14 = {};
      if (vErrors === null) {
        vErrors = [err14];
      } else {
        vErrors.push(err14);
      }
      errors++;
    } else {
      if (data.state !== void 0) {
        if ("CHOOSING" !== data.state) {
          const err15 = {};
          if (vErrors === null) {
            vErrors = [err15];
          } else {
            vErrors.push(err15);
          }
          errors++;
        }
      }
    }
  }
  var _valid4 = _errs23 === errors;
  errors = _errs22;
  if (vErrors !== null) {
    if (_errs22) {
      vErrors.length = _errs22;
    } else {
      vErrors = null;
    }
  }
  if (_valid4) {
    const _errs25 = errors;
    if (data && typeof data == "object" && !Array.isArray(data)) {
      if (data.choices === void 0) {
        const err16 = { instancePath, schemaPath: "#/allOf/4/then/required", keyword: "required", params: { missingProperty: "choices" }, message: "must have required property 'choices'" };
        if (vErrors === null) {
          vErrors = [err16];
        } else {
          vErrors.push(err16);
        }
        errors++;
      }
    }
    var _valid4 = _errs25 === errors;
    valid9 = _valid4;
  }
  if (!valid9) {
    const err17 = { instancePath, schemaPath: "#/allOf/4/if", keyword: "if", params: { failingKeyword: "then" }, message: 'must match "then" schema' };
    if (vErrors === null) {
      vErrors = [err17];
    } else {
      vErrors.push(err17);
    }
    errors++;
  }
  if (props0 !== true) {
    props0 = props0 || {};
    props0.state = true;
  }
  const _errs27 = errors;
  let valid11 = true;
  const _errs28 = errors;
  if (data && typeof data == "object" && !Array.isArray(data)) {
    let missing5;
    if (data.choices === void 0 && (missing5 = "choices")) {
      const err18 = {};
      if (vErrors === null) {
        vErrors = [err18];
      } else {
        vErrors.push(err18);
      }
      errors++;
    }
  }
  var _valid5 = _errs28 === errors;
  errors = _errs27;
  if (vErrors !== null) {
    if (_errs27) {
      vErrors.length = _errs27;
    } else {
      vErrors = null;
    }
  }
  if (_valid5) {
    const _errs29 = errors;
    if (data && typeof data == "object" && !Array.isArray(data)) {
      if (data.state !== void 0) {
        if ("CHOOSING" !== data.state) {
          const err19 = { instancePath: instancePath + "/state", schemaPath: "#/allOf/5/then/properties/state/const", keyword: "const", params: { allowedValue: "CHOOSING" }, message: "must be equal to constant" };
          if (vErrors === null) {
            vErrors = [err19];
          } else {
            vErrors.push(err19);
          }
          errors++;
        }
      }
    }
    var _valid5 = _errs29 === errors;
    valid11 = _valid5;
    if (valid11) {
      var props2 = {};
      props2.state = true;
    }
  }
  if (!valid11) {
    const err20 = { instancePath, schemaPath: "#/allOf/5/if", keyword: "if", params: { failingKeyword: "then" }, message: 'must match "then" schema' };
    if (vErrors === null) {
      vErrors = [err20];
    } else {
      vErrors.push(err20);
    }
    errors++;
  }
  if (props0 !== true && props2 !== void 0) {
    if (props2 === true) {
      props0 = true;
    } else {
      props0 = props0 || {};
      Object.assign(props0, props2);
    }
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.state === void 0) {
      const err21 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "state" }, message: "must have required property 'state'" };
      if (vErrors === null) {
        vErrors = [err21];
      } else {
        vErrors.push(err21);
      }
      errors++;
    }
    if (data.text === void 0) {
      const err22 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "text" }, message: "must have required property 'text'" };
      if (vErrors === null) {
        vErrors = [err22];
      } else {
        vErrors.push(err22);
      }
      errors++;
    }
    for (const key0 in data) {
      if (!func51.call(schema81.properties, key0)) {
        const err23 = { instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
        if (vErrors === null) {
          vErrors = [err23];
        } else {
          vErrors.push(err23);
        }
        errors++;
      }
    }
    if (data.state !== void 0) {
      let data6 = data.state;
      if (!(data6 === "IDLE" || data6 === "CHOOSING" || data6 === "NOT_OPEN" || data6 === "STARTING" || data6 === "LISTENING" || data6 === "REPEAT_PROMPT" || data6 === "SENDING" || data6 === "WAITING_STAFF" || data6 === "CALL_STAFF" || data6 === "ENDING" || data6 === "ENDED")) {
        const err24 = { instancePath: instancePath + "/state", schemaPath: "#/properties/state/enum", keyword: "enum", params: { allowedValues: schema81.properties.state.enum }, message: "must be equal to one of the allowed values" };
        if (vErrors === null) {
          vErrors = [err24];
        } else {
          vErrors.push(err24);
        }
        errors++;
      }
    }
    if (data.text !== void 0) {
      let data7 = data.text;
      if (typeof data7 !== "string" && data7 !== null) {
        const err25 = { instancePath: instancePath + "/text", schemaPath: "#/properties/text/type", keyword: "type", params: { type: schema81.properties.text.type }, message: "must be string,null" };
        if (vErrors === null) {
          vErrors = [err25];
        } else {
          vErrors.push(err25);
        }
        errors++;
      }
    }
    if (data.callStaffReason !== void 0) {
      let data8 = data.callStaffReason;
      if (!(data8 === "RETRY_EXHAUSTED" || data8 === "DELIVERY_FAILED" || data8 === "AUTH" || data8 === "START_FAILED" || data8 === "STAFF_REQUESTED" || data8 === "BAD_SUBJECT_REF" || data8 === "REPEAT_LIMIT")) {
        const err26 = { instancePath: instancePath + "/callStaffReason", schemaPath: "#/properties/callStaffReason/enum", keyword: "enum", params: { allowedValues: schema81.properties.callStaffReason.enum }, message: "must be equal to one of the allowed values" };
        if (vErrors === null) {
          vErrors = [err26];
        } else {
          vErrors.push(err26);
        }
        errors++;
      }
    }
    if (data.repeatReason !== void 0) {
      let data9 = data.repeatReason;
      if (!(data9 === "EMPTY_STT" || data9 === "TOO_LONG")) {
        const err27 = { instancePath: instancePath + "/repeatReason", schemaPath: "#/properties/repeatReason/enum", keyword: "enum", params: { allowedValues: schema81.properties.repeatReason.enum }, message: "must be equal to one of the allowed values" };
        if (vErrors === null) {
          vErrors = [err27];
        } else {
          vErrors.push(err27);
        }
        errors++;
      }
    }
    if (data.retrying !== void 0) {
      if (typeof data.retrying !== "boolean") {
        const err28 = { instancePath: instancePath + "/retrying", schemaPath: "#/properties/retrying/type", keyword: "type", params: { type: "boolean" }, message: "must be boolean" };
        if (vErrors === null) {
          vErrors = [err28];
        } else {
          vErrors.push(err28);
        }
        errors++;
      }
    }
    if (data.waitHint !== void 0) {
      let data11 = data.waitHint;
      if (!(data11 === "THINKING" || data11 === "PLEASE_WAIT")) {
        const err29 = { instancePath: instancePath + "/waitHint", schemaPath: "#/properties/waitHint/enum", keyword: "enum", params: { allowedValues: schema81.properties.waitHint.enum }, message: "must be equal to one of the allowed values" };
        if (vErrors === null) {
          vErrors = [err29];
        } else {
          vErrors.push(err29);
        }
        errors++;
      }
    }
    if (data.idleWarnS !== void 0) {
      let data12 = data.idleWarnS;
      if (!(typeof data12 == "number" && (!(data12 % 1) && !isNaN(data12)))) {
        const err30 = { instancePath: instancePath + "/idleWarnS", schemaPath: "#/properties/idleWarnS/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
        if (vErrors === null) {
          vErrors = [err30];
        } else {
          vErrors.push(err30);
        }
        errors++;
      }
      if (typeof data12 == "number") {
        if (data12 < 0 || isNaN(data12)) {
          const err31 = { instancePath: instancePath + "/idleWarnS", schemaPath: "#/properties/idleWarnS/minimum", keyword: "minimum", params: { comparison: ">=", limit: 0 }, message: "must be >= 0" };
          if (vErrors === null) {
            vErrors = [err31];
          } else {
            vErrors.push(err31);
          }
          errors++;
        }
      }
    }
    if (data.textFallback !== void 0) {
      if (typeof data.textFallback !== "boolean") {
        const err32 = { instancePath: instancePath + "/textFallback", schemaPath: "#/properties/textFallback/type", keyword: "type", params: { type: "boolean" }, message: "must be boolean" };
        if (vErrors === null) {
          vErrors = [err32];
        } else {
          vErrors.push(err32);
        }
        errors++;
      }
    }
    if (data.startNotice !== void 0) {
      if ("NO_SUBJECT_REF" !== data.startNotice) {
        const err33 = { instancePath: instancePath + "/startNotice", schemaPath: "#/properties/startNotice/const", keyword: "const", params: { allowedValue: "NO_SUBJECT_REF" }, message: "must be equal to constant" };
        if (vErrors === null) {
          vErrors = [err33];
        } else {
          vErrors.push(err33);
        }
        errors++;
      }
    }
    if (data.waitNotice !== void 0) {
      let data15 = data.waitNotice;
      if (!(data15 === "SERVER_UNREACHABLE" || data15 === "LONG_WAIT")) {
        const err34 = { instancePath: instancePath + "/waitNotice", schemaPath: "#/properties/waitNotice/enum", keyword: "enum", params: { allowedValues: schema81.properties.waitNotice.enum }, message: "must be equal to one of the allowed values" };
        if (vErrors === null) {
          vErrors = [err34];
        } else {
          vErrors.push(err34);
        }
        errors++;
      }
    }
    if (data.endFailed !== void 0) {
      if (typeof data.endFailed !== "boolean") {
        const err35 = { instancePath: instancePath + "/endFailed", schemaPath: "#/properties/endFailed/type", keyword: "type", params: { type: "boolean" }, message: "must be boolean" };
        if (vErrors === null) {
          vErrors = [err35];
        } else {
          vErrors.push(err35);
        }
        errors++;
      }
    }
    if (data.confirmLeave !== void 0) {
      if (typeof data.confirmLeave !== "boolean") {
        const err36 = { instancePath: instancePath + "/confirmLeave", schemaPath: "#/properties/confirmLeave/type", keyword: "type", params: { type: "boolean" }, message: "must be boolean" };
        if (vErrors === null) {
          vErrors = [err36];
        } else {
          vErrors.push(err36);
        }
        errors++;
      }
    }
    if (data.pauseReason !== void 0) {
      let data18 = data.pauseReason;
      if (!(data18 === "RISK" || data18 === "REASK_LIMIT" || data18 === "OTHER")) {
        const err37 = { instancePath: instancePath + "/pauseReason", schemaPath: "#/properties/pauseReason/enum", keyword: "enum", params: { allowedValues: schema81.properties.pauseReason.enum }, message: "must be equal to one of the allowed values" };
        if (vErrors === null) {
          vErrors = [err37];
        } else {
          vErrors.push(err37);
        }
        errors++;
      }
    }
    if (data.staffCall !== void 0) {
      let data19 = data.staffCall;
      if (data19 && typeof data19 == "object" && !Array.isArray(data19)) {
        if (data19.canRetry === void 0) {
          const err38 = { instancePath: instancePath + "/staffCall", schemaPath: "StaffCallView.json/required", keyword: "required", params: { missingProperty: "canRetry" }, message: "must have required property 'canRetry'" };
          if (vErrors === null) {
            vErrors = [err38];
          } else {
            vErrors.push(err38);
          }
          errors++;
        }
        if (data19.sending === void 0) {
          const err39 = { instancePath: instancePath + "/staffCall", schemaPath: "StaffCallView.json/required", keyword: "required", params: { missingProperty: "sending" }, message: "must have required property 'sending'" };
          if (vErrors === null) {
            vErrors = [err39];
          } else {
            vErrors.push(err39);
          }
          errors++;
        }
        if (data19.waitS === void 0) {
          const err40 = { instancePath: instancePath + "/staffCall", schemaPath: "StaffCallView.json/required", keyword: "required", params: { missingProperty: "waitS" }, message: "must have required property 'waitS'" };
          if (vErrors === null) {
            vErrors = [err40];
          } else {
            vErrors.push(err40);
          }
          errors++;
        }
        if (data19.attempts === void 0) {
          const err41 = { instancePath: instancePath + "/staffCall", schemaPath: "StaffCallView.json/required", keyword: "required", params: { missingProperty: "attempts" }, message: "must have required property 'attempts'" };
          if (vErrors === null) {
            vErrors = [err41];
          } else {
            vErrors.push(err41);
          }
          errors++;
        }
        for (const key1 in data19) {
          if (!(key1 === "canRetry" || key1 === "sending" || key1 === "waitS" || key1 === "attempts" || key1 === "notice")) {
            const err42 = { instancePath: instancePath + "/staffCall", schemaPath: "StaffCallView.json/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key1 }, message: "must NOT have additional properties" };
            if (vErrors === null) {
              vErrors = [err42];
            } else {
              vErrors.push(err42);
            }
            errors++;
          }
        }
        if (data19.canRetry !== void 0) {
          if (typeof data19.canRetry !== "boolean") {
            const err43 = { instancePath: instancePath + "/staffCall/canRetry", schemaPath: "StaffCallView.json/properties/canRetry/type", keyword: "type", params: { type: "boolean" }, message: "must be boolean" };
            if (vErrors === null) {
              vErrors = [err43];
            } else {
              vErrors.push(err43);
            }
            errors++;
          }
        }
        if (data19.sending !== void 0) {
          if (typeof data19.sending !== "boolean") {
            const err44 = { instancePath: instancePath + "/staffCall/sending", schemaPath: "StaffCallView.json/properties/sending/type", keyword: "type", params: { type: "boolean" }, message: "must be boolean" };
            if (vErrors === null) {
              vErrors = [err44];
            } else {
              vErrors.push(err44);
            }
            errors++;
          }
        }
        if (data19.waitS !== void 0) {
          let data22 = data19.waitS;
          if (!(typeof data22 == "number" && (!(data22 % 1) && !isNaN(data22)))) {
            const err45 = { instancePath: instancePath + "/staffCall/waitS", schemaPath: "StaffCallView.json/properties/waitS/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
            if (vErrors === null) {
              vErrors = [err45];
            } else {
              vErrors.push(err45);
            }
            errors++;
          }
          if (typeof data22 == "number") {
            if (data22 < 0 || isNaN(data22)) {
              const err46 = { instancePath: instancePath + "/staffCall/waitS", schemaPath: "StaffCallView.json/properties/waitS/minimum", keyword: "minimum", params: { comparison: ">=", limit: 0 }, message: "must be >= 0" };
              if (vErrors === null) {
                vErrors = [err46];
              } else {
                vErrors.push(err46);
              }
              errors++;
            }
          }
        }
        if (data19.attempts !== void 0) {
          let data23 = data19.attempts;
          if (!(typeof data23 == "number" && (!(data23 % 1) && !isNaN(data23)))) {
            const err47 = { instancePath: instancePath + "/staffCall/attempts", schemaPath: "StaffCallView.json/properties/attempts/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
            if (vErrors === null) {
              vErrors = [err47];
            } else {
              vErrors.push(err47);
            }
            errors++;
          }
          if (typeof data23 == "number") {
            if (data23 < 0 || isNaN(data23)) {
              const err48 = { instancePath: instancePath + "/staffCall/attempts", schemaPath: "StaffCallView.json/properties/attempts/minimum", keyword: "minimum", params: { comparison: ">=", limit: 0 }, message: "must be >= 0" };
              if (vErrors === null) {
                vErrors = [err48];
              } else {
                vErrors.push(err48);
              }
              errors++;
            }
          }
        }
        if (data19.notice !== void 0) {
          let data24 = data19.notice;
          if (!(data24 === "NO_ALERT" || data24 === "STILL_FAILED" || data24 === "NETWORK" || data24 === "LIMIT" || data24 === "UNSUPPORTED" || data24 === "REPORT_FAILED" || data24 === "AUTH" || data24 === "BUSY" || data24 === "READY")) {
            const err49 = { instancePath: instancePath + "/staffCall/notice", schemaPath: "StaffCallView.json/properties/notice/enum", keyword: "enum", params: { allowedValues: schema82.properties.notice.enum }, message: "must be equal to one of the allowed values" };
            if (vErrors === null) {
              vErrors = [err49];
            } else {
              vErrors.push(err49);
            }
            errors++;
          }
        }
      } else {
        const err50 = { instancePath: instancePath + "/staffCall", schemaPath: "StaffCallView.json/type", keyword: "type", params: { type: "object" }, message: "must be object" };
        if (vErrors === null) {
          vErrors = [err50];
        } else {
          vErrors.push(err50);
        }
        errors++;
      }
    }
    if (data.busy !== void 0) {
      if (typeof data.busy !== "boolean") {
        const err51 = { instancePath: instancePath + "/busy", schemaPath: "#/properties/busy/type", keyword: "type", params: { type: "boolean" }, message: "must be boolean" };
        if (vErrors === null) {
          vErrors = [err51];
        } else {
          vErrors.push(err51);
        }
        errors++;
      }
    }
    if (data.choices !== void 0) {
      let data26 = data.choices;
      if (Array.isArray(data26)) {
        if (data26.length < 1) {
          const err52 = { instancePath: instancePath + "/choices", schemaPath: "#/properties/choices/minItems", keyword: "minItems", params: { limit: 1 }, message: "must NOT have fewer than 1 items" };
          if (vErrors === null) {
            vErrors = [err52];
          } else {
            vErrors.push(err52);
          }
          errors++;
        }
        const len0 = data26.length;
        for (let i0 = 0; i0 < len0; i0++) {
          let data27 = data26[i0];
          if (data27 && typeof data27 == "object" && !Array.isArray(data27)) {
            if (data27.id === void 0) {
              const err53 = { instancePath: instancePath + "/choices/" + i0, schemaPath: "#/properties/choices/items/required", keyword: "required", params: { missingProperty: "id" }, message: "must have required property 'id'" };
              if (vErrors === null) {
                vErrors = [err53];
              } else {
                vErrors.push(err53);
              }
              errors++;
            }
            if (data27.title === void 0) {
              const err54 = { instancePath: instancePath + "/choices/" + i0, schemaPath: "#/properties/choices/items/required", keyword: "required", params: { missingProperty: "title" }, message: "must have required property 'title'" };
              if (vErrors === null) {
                vErrors = [err54];
              } else {
                vErrors.push(err54);
              }
              errors++;
            }
            for (const key2 in data27) {
              if (!(key2 === "id" || key2 === "title")) {
                const err55 = { instancePath: instancePath + "/choices/" + i0, schemaPath: "#/properties/choices/items/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key2 }, message: "must NOT have additional properties" };
                if (vErrors === null) {
                  vErrors = [err55];
                } else {
                  vErrors.push(err55);
                }
                errors++;
              }
            }
            if (data27.id !== void 0) {
              let data28 = data27.id;
              if (typeof data28 === "string") {
                if (func1(data28) > 128) {
                  const err56 = { instancePath: instancePath + "/choices/" + i0 + "/id", schemaPath: "DeviceConfig.schema.json#/properties/question_set_id/maxLength", keyword: "maxLength", params: { limit: 128 }, message: "must NOT have more than 128 characters" };
                  if (vErrors === null) {
                    vErrors = [err56];
                  } else {
                    vErrors.push(err56);
                  }
                  errors++;
                }
                if (func1(data28) < 1) {
                  const err57 = { instancePath: instancePath + "/choices/" + i0 + "/id", schemaPath: "DeviceConfig.schema.json#/properties/question_set_id/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" };
                  if (vErrors === null) {
                    vErrors = [err57];
                  } else {
                    vErrors.push(err57);
                  }
                  errors++;
                }
                if (!pattern7.test(data28)) {
                  const err58 = { instancePath: instancePath + "/choices/" + i0 + "/id", schemaPath: "DeviceConfig.schema.json#/properties/question_set_id/pattern", keyword: "pattern", params: { pattern: "^[A-Za-z0-9][A-Za-z0-9._:-]*$(?![\\s\\S])" }, message: 'must match pattern "^[A-Za-z0-9][A-Za-z0-9._:-]*$(?![\\s\\S])"' };
                  if (vErrors === null) {
                    vErrors = [err58];
                  } else {
                    vErrors.push(err58);
                  }
                  errors++;
                }
              } else {
                const err59 = { instancePath: instancePath + "/choices/" + i0 + "/id", schemaPath: "DeviceConfig.schema.json#/properties/question_set_id/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                if (vErrors === null) {
                  vErrors = [err59];
                } else {
                  vErrors.push(err59);
                }
                errors++;
              }
            }
            if (data27.title !== void 0) {
              let data29 = data27.title;
              if (typeof data29 === "string") {
                if (func1(data29) < 1) {
                  const err60 = { instancePath: instancePath + "/choices/" + i0 + "/title", schemaPath: "#/properties/choices/items/properties/title/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" };
                  if (vErrors === null) {
                    vErrors = [err60];
                  } else {
                    vErrors.push(err60);
                  }
                  errors++;
                }
              } else {
                const err61 = { instancePath: instancePath + "/choices/" + i0 + "/title", schemaPath: "#/properties/choices/items/properties/title/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                if (vErrors === null) {
                  vErrors = [err61];
                } else {
                  vErrors.push(err61);
                }
                errors++;
              }
            }
          } else {
            const err62 = { instancePath: instancePath + "/choices/" + i0, schemaPath: "#/properties/choices/items/type", keyword: "type", params: { type: "object" }, message: "must be object" };
            if (vErrors === null) {
              vErrors = [err62];
            } else {
              vErrors.push(err62);
            }
            errors++;
          }
        }
      } else {
        const err63 = { instancePath: instancePath + "/choices", schemaPath: "#/properties/choices/type", keyword: "type", params: { type: "array" }, message: "must be array" };
        if (vErrors === null) {
          vErrors = [err63];
        } else {
          vErrors.push(err63);
        }
        errors++;
      }
    }
  } else {
    const err64 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err64];
    } else {
      vErrors.push(err64);
    }
    errors++;
  }
  validate64.errors = vErrors;
  return errors === 0;
}
validate64.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
exports.PauseLabel = validate65;
var schema84 = { "$id": "PauseLabel.json", "title": "PauseLabel", "description": "\uC815\uC9C0 \uC0AC\uC720 \uD45C\uC2DC. \uAE00\uC790 \uC811\uB450\uB97C \uD56D\uC0C1 \uAC19\uC774 \uC4F4\uB2E4(\uC0C9\uC5D0\uB9CC \uAE30\uB300\uC9C0 \uC54A\uB294\uB2E4).", "type": "object", "properties": { "reason": { "enum": ["RISK", "REASK_LIMIT", "OTHER"] }, "text": { "type": "string", "minLength": 1 } }, "required": ["reason", "text"], "additionalProperties": false };
function validate65(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  ;
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate65.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.reason === void 0) {
      const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "reason" }, message: "must have required property 'reason'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.text === void 0) {
      const err1 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "text" }, message: "must have required property 'text'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    for (const key0 in data) {
      if (!(key0 === "reason" || key0 === "text")) {
        const err2 = { instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
        if (vErrors === null) {
          vErrors = [err2];
        } else {
          vErrors.push(err2);
        }
        errors++;
      }
    }
    if (data.reason !== void 0) {
      let data0 = data.reason;
      if (!(data0 === "RISK" || data0 === "REASK_LIMIT" || data0 === "OTHER")) {
        const err3 = { instancePath: instancePath + "/reason", schemaPath: "#/properties/reason/enum", keyword: "enum", params: { allowedValues: schema84.properties.reason.enum }, message: "must be equal to one of the allowed values" };
        if (vErrors === null) {
          vErrors = [err3];
        } else {
          vErrors.push(err3);
        }
        errors++;
      }
    }
    if (data.text !== void 0) {
      let data1 = data.text;
      if (typeof data1 === "string") {
        if (func1(data1) < 1) {
          const err4 = { instancePath: instancePath + "/text", schemaPath: "#/properties/text/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" };
          if (vErrors === null) {
            vErrors = [err4];
          } else {
            vErrors.push(err4);
          }
          errors++;
        }
      } else {
        const err5 = { instancePath: instancePath + "/text", schemaPath: "#/properties/text/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      }
    }
  } else {
    const err6 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err6];
    } else {
      vErrors.push(err6);
    }
    errors++;
  }
  validate65.errors = vErrors;
  return errors === 0;
}
validate65.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
exports.PushNotification = validate66;
function validate66(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  ;
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate66.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.body === void 0) {
      const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "body" }, message: "must have required property 'body'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.tag === void 0) {
      const err1 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "tag" }, message: "must have required property 'tag'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    for (const key0 in data) {
      if (!(key0 === "body" || key0 === "tag")) {
        const err2 = { instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
        if (vErrors === null) {
          vErrors = [err2];
        } else {
          vErrors.push(err2);
        }
        errors++;
      }
    }
    if (data.body !== void 0) {
      let data0 = data.body;
      if (typeof data0 === "string") {
        if (func1(data0) < 1) {
          const err3 = { instancePath: instancePath + "/body", schemaPath: "#/properties/body/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" };
          if (vErrors === null) {
            vErrors = [err3];
          } else {
            vErrors.push(err3);
          }
          errors++;
        }
      } else {
        const err4 = { instancePath: instancePath + "/body", schemaPath: "#/properties/body/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err4];
        } else {
          vErrors.push(err4);
        }
        errors++;
      }
    }
    if (data.tag !== void 0) {
      let data1 = data.tag;
      if (typeof data1 === "string") {
        if (func1(data1) < 1) {
          const err5 = { instancePath: instancePath + "/tag", schemaPath: "#/properties/tag/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" };
          if (vErrors === null) {
            vErrors = [err5];
          } else {
            vErrors.push(err5);
          }
          errors++;
        }
      } else {
        const err6 = { instancePath: instancePath + "/tag", schemaPath: "#/properties/tag/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
  } else {
    const err7 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err7];
    } else {
      vErrors.push(err7);
    }
    errors++;
  }
  validate66.errors = vErrors;
  return errors === 0;
}
validate66.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
exports.RetryDecision = validate67;
function validate67(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  ;
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate67.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.giveUp === void 0) {
      const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "giveUp" }, message: "must have required property 'giveUp'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.waitMs === void 0) {
      const err1 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "waitMs" }, message: "must have required property 'waitMs'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    for (const key0 in data) {
      if (!(key0 === "giveUp" || key0 === "waitMs")) {
        const err2 = { instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
        if (vErrors === null) {
          vErrors = [err2];
        } else {
          vErrors.push(err2);
        }
        errors++;
      }
    }
    if (data.giveUp !== void 0) {
      if (typeof data.giveUp !== "boolean") {
        const err3 = { instancePath: instancePath + "/giveUp", schemaPath: "#/properties/giveUp/type", keyword: "type", params: { type: "boolean" }, message: "must be boolean" };
        if (vErrors === null) {
          vErrors = [err3];
        } else {
          vErrors.push(err3);
        }
        errors++;
      }
    }
    if (data.waitMs !== void 0) {
      let data1 = data.waitMs;
      if (!(typeof data1 == "number" && (!(data1 % 1) && !isNaN(data1)))) {
        const err4 = { instancePath: instancePath + "/waitMs", schemaPath: "#/properties/waitMs/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
        if (vErrors === null) {
          vErrors = [err4];
        } else {
          vErrors.push(err4);
        }
        errors++;
      }
      if (typeof data1 == "number") {
        if (data1 < 0 || isNaN(data1)) {
          const err5 = { instancePath: instancePath + "/waitMs", schemaPath: "#/properties/waitMs/minimum", keyword: "minimum", params: { comparison: ">=", limit: 0 }, message: "must be >= 0" };
          if (vErrors === null) {
            vErrors = [err5];
          } else {
            vErrors.push(err5);
          }
          errors++;
        }
      }
    }
  } else {
    const err6 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err6];
    } else {
      vErrors.push(err6);
    }
    errors++;
  }
  validate67.errors = vErrors;
  return errors === 0;
}
validate67.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
exports.RetryPolicy = validate68;
function validate68(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  ;
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate68.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.baseMs === void 0) {
      const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "baseMs" }, message: "must have required property 'baseMs'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.factor === void 0) {
      const err1 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "factor" }, message: "must have required property 'factor'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.maxMs === void 0) {
      const err2 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "maxMs" }, message: "must have required property 'maxMs'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.budgetMs === void 0) {
      const err3 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "budgetMs" }, message: "must have required property 'budgetMs'" };
      if (vErrors === null) {
        vErrors = [err3];
      } else {
        vErrors.push(err3);
      }
      errors++;
    }
    if (data.minJitter === void 0) {
      const err4 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "minJitter" }, message: "must have required property 'minJitter'" };
      if (vErrors === null) {
        vErrors = [err4];
      } else {
        vErrors.push(err4);
      }
      errors++;
    }
    for (const key0 in data) {
      if (!(key0 === "baseMs" || key0 === "factor" || key0 === "maxMs" || key0 === "budgetMs" || key0 === "maxAttempts" || key0 === "minJitter")) {
        const err5 = { instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      }
    }
    if (data.baseMs !== void 0) {
      let data0 = data.baseMs;
      if (typeof data0 == "number") {
        if (data0 <= 0 || isNaN(data0)) {
          const err6 = { instancePath: instancePath + "/baseMs", schemaPath: "#/properties/baseMs/exclusiveMinimum", keyword: "exclusiveMinimum", params: { comparison: ">", limit: 0 }, message: "must be > 0" };
          if (vErrors === null) {
            vErrors = [err6];
          } else {
            vErrors.push(err6);
          }
          errors++;
        }
      } else {
        const err7 = { instancePath: instancePath + "/baseMs", schemaPath: "#/properties/baseMs/type", keyword: "type", params: { type: "number" }, message: "must be number" };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
    }
    if (data.factor !== void 0) {
      let data1 = data.factor;
      if (typeof data1 == "number") {
        if (data1 < 1 || isNaN(data1)) {
          const err8 = { instancePath: instancePath + "/factor", schemaPath: "#/properties/factor/minimum", keyword: "minimum", params: { comparison: ">=", limit: 1 }, message: "must be >= 1" };
          if (vErrors === null) {
            vErrors = [err8];
          } else {
            vErrors.push(err8);
          }
          errors++;
        }
      } else {
        const err9 = { instancePath: instancePath + "/factor", schemaPath: "#/properties/factor/type", keyword: "type", params: { type: "number" }, message: "must be number" };
        if (vErrors === null) {
          vErrors = [err9];
        } else {
          vErrors.push(err9);
        }
        errors++;
      }
    }
    if (data.maxMs !== void 0) {
      let data2 = data.maxMs;
      if (typeof data2 == "number") {
        if (data2 <= 0 || isNaN(data2)) {
          const err10 = { instancePath: instancePath + "/maxMs", schemaPath: "#/properties/maxMs/exclusiveMinimum", keyword: "exclusiveMinimum", params: { comparison: ">", limit: 0 }, message: "must be > 0" };
          if (vErrors === null) {
            vErrors = [err10];
          } else {
            vErrors.push(err10);
          }
          errors++;
        }
      } else {
        const err11 = { instancePath: instancePath + "/maxMs", schemaPath: "#/properties/maxMs/type", keyword: "type", params: { type: "number" }, message: "must be number" };
        if (vErrors === null) {
          vErrors = [err11];
        } else {
          vErrors.push(err11);
        }
        errors++;
      }
    }
    if (data.budgetMs !== void 0) {
      let data3 = data.budgetMs;
      if (typeof data3 == "number") {
        if (data3 <= 0 || isNaN(data3)) {
          const err12 = { instancePath: instancePath + "/budgetMs", schemaPath: "#/properties/budgetMs/exclusiveMinimum", keyword: "exclusiveMinimum", params: { comparison: ">", limit: 0 }, message: "must be > 0" };
          if (vErrors === null) {
            vErrors = [err12];
          } else {
            vErrors.push(err12);
          }
          errors++;
        }
      } else {
        const err13 = { instancePath: instancePath + "/budgetMs", schemaPath: "#/properties/budgetMs/type", keyword: "type", params: { type: "number" }, message: "must be number" };
        if (vErrors === null) {
          vErrors = [err13];
        } else {
          vErrors.push(err13);
        }
        errors++;
      }
    }
    if (data.maxAttempts !== void 0) {
      let data4 = data.maxAttempts;
      if (typeof data4 == "number") {
        if (data4 <= 0 || isNaN(data4)) {
          const err14 = { instancePath: instancePath + "/maxAttempts", schemaPath: "#/properties/maxAttempts/exclusiveMinimum", keyword: "exclusiveMinimum", params: { comparison: ">", limit: 0 }, message: "must be > 0" };
          if (vErrors === null) {
            vErrors = [err14];
          } else {
            vErrors.push(err14);
          }
          errors++;
        }
      } else {
        const err15 = { instancePath: instancePath + "/maxAttempts", schemaPath: "#/properties/maxAttempts/type", keyword: "type", params: { type: "number" }, message: "must be number" };
        if (vErrors === null) {
          vErrors = [err15];
        } else {
          vErrors.push(err15);
        }
        errors++;
      }
    }
    if (data.minJitter !== void 0) {
      let data5 = data.minJitter;
      if (typeof data5 == "number") {
        if (data5 > 1 || isNaN(data5)) {
          const err16 = { instancePath: instancePath + "/minJitter", schemaPath: "#/properties/minJitter/maximum", keyword: "maximum", params: { comparison: "<=", limit: 1 }, message: "must be <= 1" };
          if (vErrors === null) {
            vErrors = [err16];
          } else {
            vErrors.push(err16);
          }
          errors++;
        }
        if (data5 < 0 || isNaN(data5)) {
          const err17 = { instancePath: instancePath + "/minJitter", schemaPath: "#/properties/minJitter/minimum", keyword: "minimum", params: { comparison: ">=", limit: 0 }, message: "must be >= 0" };
          if (vErrors === null) {
            vErrors = [err17];
          } else {
            vErrors.push(err17);
          }
          errors++;
        }
      } else {
        const err18 = { instancePath: instancePath + "/minJitter", schemaPath: "#/properties/minJitter/type", keyword: "type", params: { type: "number" }, message: "must be number" };
        if (vErrors === null) {
          vErrors = [err18];
        } else {
          vErrors.push(err18);
        }
        errors++;
      }
    }
  } else {
    const err19 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err19];
    } else {
      vErrors.push(err19);
    }
    errors++;
  }
  validate68.errors = vErrors;
  return errors === 0;
}
validate68.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
exports.RetryQuery = validate69;
function validate69(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  ;
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate69.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.attempt === void 0) {
      const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "attempt" }, message: "must have required property 'attempt'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.retryAfterMs === void 0) {
      const err1 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "retryAfterMs" }, message: "must have required property 'retryAfterMs'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.elapsedMs === void 0) {
      const err2 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "elapsedMs" }, message: "must have required property 'elapsedMs'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    for (const key0 in data) {
      if (!(key0 === "attempt" || key0 === "retryAfterMs" || key0 === "elapsedMs")) {
        const err3 = { instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
        if (vErrors === null) {
          vErrors = [err3];
        } else {
          vErrors.push(err3);
        }
        errors++;
      }
    }
    if (data.attempt !== void 0) {
      let data0 = data.attempt;
      if (!(typeof data0 == "number" && (!(data0 % 1) && !isNaN(data0)))) {
        const err4 = { instancePath: instancePath + "/attempt", schemaPath: "#/properties/attempt/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
        if (vErrors === null) {
          vErrors = [err4];
        } else {
          vErrors.push(err4);
        }
        errors++;
      }
      if (typeof data0 == "number") {
        if (data0 < 1 || isNaN(data0)) {
          const err5 = { instancePath: instancePath + "/attempt", schemaPath: "#/properties/attempt/minimum", keyword: "minimum", params: { comparison: ">=", limit: 1 }, message: "must be >= 1" };
          if (vErrors === null) {
            vErrors = [err5];
          } else {
            vErrors.push(err5);
          }
          errors++;
        }
      }
    }
    if (data.retryAfterMs !== void 0) {
      let data1 = data.retryAfterMs;
      const _errs5 = errors;
      let valid1 = false;
      const _errs6 = errors;
      if (!(typeof data1 == "number" && (!(data1 % 1) && !isNaN(data1)))) {
        const err6 = { instancePath: instancePath + "/retryAfterMs", schemaPath: "#/properties/retryAfterMs/anyOf/0/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
      if (typeof data1 == "number") {
        if (data1 < 0 || isNaN(data1)) {
          const err7 = { instancePath: instancePath + "/retryAfterMs", schemaPath: "#/properties/retryAfterMs/anyOf/0/minimum", keyword: "minimum", params: { comparison: ">=", limit: 0 }, message: "must be >= 0" };
          if (vErrors === null) {
            vErrors = [err7];
          } else {
            vErrors.push(err7);
          }
          errors++;
        }
      }
      var _valid0 = _errs6 === errors;
      valid1 = valid1 || _valid0;
      const _errs8 = errors;
      if (data1 !== null) {
        const err8 = { instancePath: instancePath + "/retryAfterMs", schemaPath: "#/properties/retryAfterMs/anyOf/1/type", keyword: "type", params: { type: "null" }, message: "must be null" };
        if (vErrors === null) {
          vErrors = [err8];
        } else {
          vErrors.push(err8);
        }
        errors++;
      }
      var _valid0 = _errs8 === errors;
      valid1 = valid1 || _valid0;
      if (!valid1) {
        const err9 = { instancePath: instancePath + "/retryAfterMs", schemaPath: "#/properties/retryAfterMs/anyOf", keyword: "anyOf", params: {}, message: "must match a schema in anyOf" };
        if (vErrors === null) {
          vErrors = [err9];
        } else {
          vErrors.push(err9);
        }
        errors++;
      } else {
        errors = _errs5;
        if (vErrors !== null) {
          if (_errs5) {
            vErrors.length = _errs5;
          } else {
            vErrors = null;
          }
        }
      }
    }
    if (data.elapsedMs !== void 0) {
      let data2 = data.elapsedMs;
      if (typeof data2 == "number") {
        if (data2 < 0 || isNaN(data2)) {
          const err10 = { instancePath: instancePath + "/elapsedMs", schemaPath: "#/properties/elapsedMs/minimum", keyword: "minimum", params: { comparison: ">=", limit: 0 }, message: "must be >= 0" };
          if (vErrors === null) {
            vErrors = [err10];
          } else {
            vErrors.push(err10);
          }
          errors++;
        }
      } else {
        const err11 = { instancePath: instancePath + "/elapsedMs", schemaPath: "#/properties/elapsedMs/type", keyword: "type", params: { type: "number" }, message: "must be number" };
        if (vErrors === null) {
          vErrors = [err11];
        } else {
          vErrors.push(err11);
        }
        errors++;
      }
    }
  } else {
    const err12 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err12];
    } else {
      vErrors.push(err12);
    }
    errors++;
  }
  validate69.errors = vErrors;
  return errors === 0;
}
validate69.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
exports.SessionRequest = validate70;
function validate71(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate71.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (typeof data === "string") {
    if (func1(data) > 128) {
      const err0 = { instancePath, schemaPath: "#/$defs/Id/maxLength", keyword: "maxLength", params: { limit: 128 }, message: "must NOT have more than 128 characters" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (func1(data) < 1) {
      const err1 = { instancePath, schemaPath: "#/$defs/Id/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (!pattern7.test(data)) {
      const err2 = { instancePath, schemaPath: "#/$defs/Id/pattern", keyword: "pattern", params: { pattern: "^[A-Za-z0-9][A-Za-z0-9._:-]*$(?![\\s\\S])" }, message: 'must match pattern "^[A-Za-z0-9][A-Za-z0-9._:-]*$(?![\\s\\S])"' };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
  } else {
    const err3 = { instancePath, schemaPath: "#/$defs/Id/type", keyword: "type", params: { type: "string" }, message: "must be string" };
    if (vErrors === null) {
      vErrors = [err3];
    } else {
      vErrors.push(err3);
    }
    errors++;
  }
  if (typeof data === "string") {
    if (func1(data) > 64) {
      const err4 = { instancePath, schemaPath: "#/maxLength", keyword: "maxLength", params: { limit: 64 }, message: "must NOT have more than 64 characters" };
      if (vErrors === null) {
        vErrors = [err4];
      } else {
        vErrors.push(err4);
      }
      errors++;
    }
    if (!pattern8.test(data)) {
      const err5 = { instancePath, schemaPath: "#/pattern", keyword: "pattern", params: { pattern: "^[A-Za-z0-9_-]*$(?![\\s\\S])" }, message: 'must match pattern "^[A-Za-z0-9_-]*$(?![\\s\\S])"' };
      if (vErrors === null) {
        vErrors = [err5];
      } else {
        vErrors.push(err5);
      }
      errors++;
    }
  }
  validate71.errors = vErrors;
  return errors === 0;
}
validate71.evaluated = { "dynamicProps": false, "dynamicItems": false };
function validate70(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  ;
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate70.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.session_id === void 0) {
      const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "session_id" }, message: "must have required property 'session_id'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    for (const key0 in data) {
      if (!(key0 === "session_id")) {
        const err1 = { instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
        if (vErrors === null) {
          vErrors = [err1];
        } else {
          vErrors.push(err1);
        }
        errors++;
      }
    }
    if (data.session_id !== void 0) {
      if (!validate71(data.session_id, { instancePath: instancePath + "/session_id", parentData: data, parentDataProperty: "session_id", rootData, dynamicAnchors })) {
        vErrors = vErrors === null ? validate71.errors : vErrors.concat(validate71.errors);
        errors = vErrors.length;
      }
    }
  } else {
    const err2 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err2];
    } else {
      vErrors.push(err2);
    }
    errors++;
  }
  validate70.errors = vErrors;
  return errors === 0;
}
validate70.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
exports.SessionStartBody = validate73;
function validate74(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate74.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.kind === void 0) {
      const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "kind" }, message: "must have required property 'kind'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    for (const key0 in data) {
      if (!(key0 === "kind" || key0 === "turn_id" || key0 === "subject_ref" || key0 === "question_set_id")) {
        const err1 = { instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
        if (vErrors === null) {
          vErrors = [err1];
        } else {
          vErrors.push(err1);
        }
        errors++;
      }
    }
    if (data.kind !== void 0) {
      if ("SESSION_START" !== data.kind) {
        const err2 = { instancePath: instancePath + "/kind", schemaPath: "#/properties/kind/const", keyword: "const", params: { allowedValue: "SESSION_START" }, message: "must be equal to constant" };
        if (vErrors === null) {
          vErrors = [err2];
        } else {
          vErrors.push(err2);
        }
        errors++;
      }
    }
    if (data.turn_id !== void 0) {
      let data1 = data.turn_id;
      if (typeof data1 === "string") {
        if (func1(data1) > 128) {
          const err3 = { instancePath: instancePath + "/turn_id", schemaPath: "_common.schema.json#/$defs/Id/maxLength", keyword: "maxLength", params: { limit: 128 }, message: "must NOT have more than 128 characters" };
          if (vErrors === null) {
            vErrors = [err3];
          } else {
            vErrors.push(err3);
          }
          errors++;
        }
        if (func1(data1) < 1) {
          const err4 = { instancePath: instancePath + "/turn_id", schemaPath: "_common.schema.json#/$defs/Id/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" };
          if (vErrors === null) {
            vErrors = [err4];
          } else {
            vErrors.push(err4);
          }
          errors++;
        }
        if (!pattern7.test(data1)) {
          const err5 = { instancePath: instancePath + "/turn_id", schemaPath: "_common.schema.json#/$defs/Id/pattern", keyword: "pattern", params: { pattern: "^[A-Za-z0-9][A-Za-z0-9._:-]*$(?![\\s\\S])" }, message: 'must match pattern "^[A-Za-z0-9][A-Za-z0-9._:-]*$(?![\\s\\S])"' };
          if (vErrors === null) {
            vErrors = [err5];
          } else {
            vErrors.push(err5);
          }
          errors++;
        }
      } else {
        const err6 = { instancePath: instancePath + "/turn_id", schemaPath: "_common.schema.json#/$defs/Id/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
    if (data.subject_ref !== void 0) {
      let data2 = data.subject_ref;
      if (typeof data2 === "string") {
        if (!pattern16.test(data2)) {
          const err7 = { instancePath: instancePath + "/subject_ref", schemaPath: "#/properties/subject_ref/pattern", keyword: "pattern", params: { pattern: "^[A-Za-z0-9._:/#=+-]{1,128}$(?![\\s\\S])" }, message: 'must match pattern "^[A-Za-z0-9._:/#=+-]{1,128}$(?![\\s\\S])"' };
          if (vErrors === null) {
            vErrors = [err7];
          } else {
            vErrors.push(err7);
          }
          errors++;
        }
      } else {
        const err8 = { instancePath: instancePath + "/subject_ref", schemaPath: "#/properties/subject_ref/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err8];
        } else {
          vErrors.push(err8);
        }
        errors++;
      }
    }
    if (data.question_set_id !== void 0) {
      let data3 = data.question_set_id;
      if (typeof data3 === "string") {
        if (func1(data3) > 128) {
          const err9 = { instancePath: instancePath + "/question_set_id", schemaPath: "_common.schema.json#/$defs/Id/maxLength", keyword: "maxLength", params: { limit: 128 }, message: "must NOT have more than 128 characters" };
          if (vErrors === null) {
            vErrors = [err9];
          } else {
            vErrors.push(err9);
          }
          errors++;
        }
        if (func1(data3) < 1) {
          const err10 = { instancePath: instancePath + "/question_set_id", schemaPath: "_common.schema.json#/$defs/Id/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" };
          if (vErrors === null) {
            vErrors = [err10];
          } else {
            vErrors.push(err10);
          }
          errors++;
        }
        if (!pattern7.test(data3)) {
          const err11 = { instancePath: instancePath + "/question_set_id", schemaPath: "_common.schema.json#/$defs/Id/pattern", keyword: "pattern", params: { pattern: "^[A-Za-z0-9][A-Za-z0-9._:-]*$(?![\\s\\S])" }, message: 'must match pattern "^[A-Za-z0-9][A-Za-z0-9._:-]*$(?![\\s\\S])"' };
          if (vErrors === null) {
            vErrors = [err11];
          } else {
            vErrors.push(err11);
          }
          errors++;
        }
      } else {
        const err12 = { instancePath: instancePath + "/question_set_id", schemaPath: "_common.schema.json#/$defs/Id/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err12];
        } else {
          vErrors.push(err12);
        }
        errors++;
      }
    }
  } else {
    const err13 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err13];
    } else {
      vErrors.push(err13);
    }
    errors++;
  }
  validate74.errors = vErrors;
  return errors === 0;
}
validate74.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
function validate73(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  ;
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate73.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (!validate74(data, { instancePath, parentData, parentDataProperty, rootData, dynamicAnchors })) {
    vErrors = vErrors === null ? validate74.errors : vErrors.concat(validate74.errors);
    errors = vErrors.length;
  }
  validate73.errors = vErrors;
  return errors === 0;
}
validate73.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
exports.StaffCallReportInput = validate76;
var schema99 = { "enum": ["STAFF_NOTIFIED_MANUALLY", "NOT_NOTIFIED"] };
function validate77(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate77.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (typeof data === "string") {
    if (func1(data) > 128) {
      const err0 = { instancePath, schemaPath: "#/$defs/Id/maxLength", keyword: "maxLength", params: { limit: 128 }, message: "must NOT have more than 128 characters" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (func1(data) < 1) {
      const err1 = { instancePath, schemaPath: "#/$defs/Id/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (!pattern7.test(data)) {
      const err2 = { instancePath, schemaPath: "#/$defs/Id/pattern", keyword: "pattern", params: { pattern: "^[A-Za-z0-9][A-Za-z0-9._:-]*$(?![\\s\\S])" }, message: 'must match pattern "^[A-Za-z0-9][A-Za-z0-9._:-]*$(?![\\s\\S])"' };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
  } else {
    const err3 = { instancePath, schemaPath: "#/$defs/Id/type", keyword: "type", params: { type: "string" }, message: "must be string" };
    if (vErrors === null) {
      vErrors = [err3];
    } else {
      vErrors.push(err3);
    }
    errors++;
  }
  if (typeof data === "string") {
    if (func1(data) > 64) {
      const err4 = { instancePath, schemaPath: "#/maxLength", keyword: "maxLength", params: { limit: 64 }, message: "must NOT have more than 64 characters" };
      if (vErrors === null) {
        vErrors = [err4];
      } else {
        vErrors.push(err4);
      }
      errors++;
    }
    if (!pattern8.test(data)) {
      const err5 = { instancePath, schemaPath: "#/pattern", keyword: "pattern", params: { pattern: "^[A-Za-z0-9_-]*$(?![\\s\\S])" }, message: 'must match pattern "^[A-Za-z0-9_-]*$(?![\\s\\S])"' };
      if (vErrors === null) {
        vErrors = [err5];
      } else {
        vErrors.push(err5);
      }
      errors++;
    }
  }
  validate77.errors = vErrors;
  return errors === 0;
}
validate77.evaluated = { "dynamicProps": false, "dynamicItems": false };
function validate76(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  ;
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate76.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.session_id === void 0) {
      const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "session_id" }, message: "must have required property 'session_id'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.outcome === void 0) {
      const err1 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "outcome" }, message: "must have required property 'outcome'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.turn_id === void 0) {
      const err2 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "turn_id" }, message: "must have required property 'turn_id'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    for (const key0 in data) {
      if (!(key0 === "session_id" || key0 === "outcome" || key0 === "turn_id")) {
        const err3 = { instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
        if (vErrors === null) {
          vErrors = [err3];
        } else {
          vErrors.push(err3);
        }
        errors++;
      }
    }
    if (data.session_id !== void 0) {
      if (!validate77(data.session_id, { instancePath: instancePath + "/session_id", parentData: data, parentDataProperty: "session_id", rootData, dynamicAnchors })) {
        vErrors = vErrors === null ? validate77.errors : vErrors.concat(validate77.errors);
        errors = vErrors.length;
      }
    }
    if (data.outcome !== void 0) {
      let data1 = data.outcome;
      if (!(data1 === "STAFF_NOTIFIED_MANUALLY" || data1 === "NOT_NOTIFIED")) {
        const err4 = { instancePath: instancePath + "/outcome", schemaPath: "StaffCallReport.schema.json#/properties/outcome/enum", keyword: "enum", params: { allowedValues: schema99.enum }, message: "must be equal to one of the allowed values" };
        if (vErrors === null) {
          vErrors = [err4];
        } else {
          vErrors.push(err4);
        }
        errors++;
      }
    }
    if (data.turn_id !== void 0) {
      let data2 = data.turn_id;
      if (typeof data2 === "string") {
        if (func1(data2) > 128) {
          const err5 = { instancePath: instancePath + "/turn_id", schemaPath: "StaffCallReport.schema.json#/properties/turn_id/maxLength", keyword: "maxLength", params: { limit: 128 }, message: "must NOT have more than 128 characters" };
          if (vErrors === null) {
            vErrors = [err5];
          } else {
            vErrors.push(err5);
          }
          errors++;
        }
        if (func1(data2) < 1) {
          const err6 = { instancePath: instancePath + "/turn_id", schemaPath: "StaffCallReport.schema.json#/properties/turn_id/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" };
          if (vErrors === null) {
            vErrors = [err6];
          } else {
            vErrors.push(err6);
          }
          errors++;
        }
        if (!pattern7.test(data2)) {
          const err7 = { instancePath: instancePath + "/turn_id", schemaPath: "StaffCallReport.schema.json#/properties/turn_id/pattern", keyword: "pattern", params: { pattern: "^[A-Za-z0-9][A-Za-z0-9._:-]*$(?![\\s\\S])" }, message: 'must match pattern "^[A-Za-z0-9][A-Za-z0-9._:-]*$(?![\\s\\S])"' };
          if (vErrors === null) {
            vErrors = [err7];
          } else {
            vErrors.push(err7);
          }
          errors++;
        }
      } else {
        const err8 = { instancePath: instancePath + "/turn_id", schemaPath: "StaffCallReport.schema.json#/properties/turn_id/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err8];
        } else {
          vErrors.push(err8);
        }
        errors++;
      }
    }
  } else {
    const err9 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err9];
    } else {
      vErrors.push(err9);
    }
    errors++;
  }
  validate76.errors = vErrors;
  return errors === 0;
}
validate76.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
exports.StaffCallRetryInput = validate79;
function validate80(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate80.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (typeof data === "string") {
    if (func1(data) > 128) {
      const err0 = { instancePath, schemaPath: "#/$defs/Id/maxLength", keyword: "maxLength", params: { limit: 128 }, message: "must NOT have more than 128 characters" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (func1(data) < 1) {
      const err1 = { instancePath, schemaPath: "#/$defs/Id/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (!pattern7.test(data)) {
      const err2 = { instancePath, schemaPath: "#/$defs/Id/pattern", keyword: "pattern", params: { pattern: "^[A-Za-z0-9][A-Za-z0-9._:-]*$(?![\\s\\S])" }, message: 'must match pattern "^[A-Za-z0-9][A-Za-z0-9._:-]*$(?![\\s\\S])"' };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
  } else {
    const err3 = { instancePath, schemaPath: "#/$defs/Id/type", keyword: "type", params: { type: "string" }, message: "must be string" };
    if (vErrors === null) {
      vErrors = [err3];
    } else {
      vErrors.push(err3);
    }
    errors++;
  }
  if (typeof data === "string") {
    if (func1(data) > 64) {
      const err4 = { instancePath, schemaPath: "#/maxLength", keyword: "maxLength", params: { limit: 64 }, message: "must NOT have more than 64 characters" };
      if (vErrors === null) {
        vErrors = [err4];
      } else {
        vErrors.push(err4);
      }
      errors++;
    }
    if (!pattern8.test(data)) {
      const err5 = { instancePath, schemaPath: "#/pattern", keyword: "pattern", params: { pattern: "^[A-Za-z0-9_-]*$(?![\\s\\S])" }, message: 'must match pattern "^[A-Za-z0-9_-]*$(?![\\s\\S])"' };
      if (vErrors === null) {
        vErrors = [err5];
      } else {
        vErrors.push(err5);
      }
      errors++;
    }
  }
  validate80.errors = vErrors;
  return errors === 0;
}
validate80.evaluated = { "dynamicProps": false, "dynamicItems": false };
function validate79(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  ;
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate79.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.session_id === void 0) {
      const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "session_id" }, message: "must have required property 'session_id'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.turn_id === void 0) {
      const err1 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "turn_id" }, message: "must have required property 'turn_id'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    for (const key0 in data) {
      if (!(key0 === "session_id" || key0 === "turn_id")) {
        const err2 = { instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
        if (vErrors === null) {
          vErrors = [err2];
        } else {
          vErrors.push(err2);
        }
        errors++;
      }
    }
    if (data.session_id !== void 0) {
      if (!validate80(data.session_id, { instancePath: instancePath + "/session_id", parentData: data, parentDataProperty: "session_id", rootData, dynamicAnchors })) {
        vErrors = vErrors === null ? validate80.errors : vErrors.concat(validate80.errors);
        errors = vErrors.length;
      }
    }
    if (data.turn_id !== void 0) {
      let data1 = data.turn_id;
      if (typeof data1 === "string") {
        if (func1(data1) > 128) {
          const err3 = { instancePath: instancePath + "/turn_id", schemaPath: "StaffCallReport.schema.json#/properties/turn_id/maxLength", keyword: "maxLength", params: { limit: 128 }, message: "must NOT have more than 128 characters" };
          if (vErrors === null) {
            vErrors = [err3];
          } else {
            vErrors.push(err3);
          }
          errors++;
        }
        if (func1(data1) < 1) {
          const err4 = { instancePath: instancePath + "/turn_id", schemaPath: "StaffCallReport.schema.json#/properties/turn_id/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" };
          if (vErrors === null) {
            vErrors = [err4];
          } else {
            vErrors.push(err4);
          }
          errors++;
        }
        if (!pattern7.test(data1)) {
          const err5 = { instancePath: instancePath + "/turn_id", schemaPath: "StaffCallReport.schema.json#/properties/turn_id/pattern", keyword: "pattern", params: { pattern: "^[A-Za-z0-9][A-Za-z0-9._:-]*$(?![\\s\\S])" }, message: 'must match pattern "^[A-Za-z0-9][A-Za-z0-9._:-]*$(?![\\s\\S])"' };
          if (vErrors === null) {
            vErrors = [err5];
          } else {
            vErrors.push(err5);
          }
          errors++;
        }
      } else {
        const err6 = { instancePath: instancePath + "/turn_id", schemaPath: "StaffCallReport.schema.json#/properties/turn_id/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
  } else {
    const err7 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err7];
    } else {
      vErrors.push(err7);
    }
    errors++;
  }
  validate79.errors = vErrors;
  return errors === 0;
}
validate79.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
exports.StaffCallView = validate82;
function validate82(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  ;
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate82.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.canRetry === void 0) {
      const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "canRetry" }, message: "must have required property 'canRetry'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.sending === void 0) {
      const err1 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "sending" }, message: "must have required property 'sending'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.waitS === void 0) {
      const err2 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "waitS" }, message: "must have required property 'waitS'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.attempts === void 0) {
      const err3 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "attempts" }, message: "must have required property 'attempts'" };
      if (vErrors === null) {
        vErrors = [err3];
      } else {
        vErrors.push(err3);
      }
      errors++;
    }
    for (const key0 in data) {
      if (!(key0 === "canRetry" || key0 === "sending" || key0 === "waitS" || key0 === "attempts" || key0 === "notice")) {
        const err4 = { instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
        if (vErrors === null) {
          vErrors = [err4];
        } else {
          vErrors.push(err4);
        }
        errors++;
      }
    }
    if (data.canRetry !== void 0) {
      if (typeof data.canRetry !== "boolean") {
        const err5 = { instancePath: instancePath + "/canRetry", schemaPath: "#/properties/canRetry/type", keyword: "type", params: { type: "boolean" }, message: "must be boolean" };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      }
    }
    if (data.sending !== void 0) {
      if (typeof data.sending !== "boolean") {
        const err6 = { instancePath: instancePath + "/sending", schemaPath: "#/properties/sending/type", keyword: "type", params: { type: "boolean" }, message: "must be boolean" };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
    if (data.waitS !== void 0) {
      let data2 = data.waitS;
      if (!(typeof data2 == "number" && (!(data2 % 1) && !isNaN(data2)))) {
        const err7 = { instancePath: instancePath + "/waitS", schemaPath: "#/properties/waitS/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
      if (typeof data2 == "number") {
        if (data2 < 0 || isNaN(data2)) {
          const err8 = { instancePath: instancePath + "/waitS", schemaPath: "#/properties/waitS/minimum", keyword: "minimum", params: { comparison: ">=", limit: 0 }, message: "must be >= 0" };
          if (vErrors === null) {
            vErrors = [err8];
          } else {
            vErrors.push(err8);
          }
          errors++;
        }
      }
    }
    if (data.attempts !== void 0) {
      let data3 = data.attempts;
      if (!(typeof data3 == "number" && (!(data3 % 1) && !isNaN(data3)))) {
        const err9 = { instancePath: instancePath + "/attempts", schemaPath: "#/properties/attempts/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
        if (vErrors === null) {
          vErrors = [err9];
        } else {
          vErrors.push(err9);
        }
        errors++;
      }
      if (typeof data3 == "number") {
        if (data3 < 0 || isNaN(data3)) {
          const err10 = { instancePath: instancePath + "/attempts", schemaPath: "#/properties/attempts/minimum", keyword: "minimum", params: { comparison: ">=", limit: 0 }, message: "must be >= 0" };
          if (vErrors === null) {
            vErrors = [err10];
          } else {
            vErrors.push(err10);
          }
          errors++;
        }
      }
    }
    if (data.notice !== void 0) {
      let data4 = data.notice;
      if (!(data4 === "NO_ALERT" || data4 === "STILL_FAILED" || data4 === "NETWORK" || data4 === "LIMIT" || data4 === "UNSUPPORTED" || data4 === "REPORT_FAILED" || data4 === "AUTH" || data4 === "BUSY" || data4 === "READY")) {
        const err11 = { instancePath: instancePath + "/notice", schemaPath: "#/properties/notice/enum", keyword: "enum", params: { allowedValues: schema82.properties.notice.enum }, message: "must be equal to one of the allowed values" };
        if (vErrors === null) {
          vErrors = [err11];
        } else {
          vErrors.push(err11);
        }
        errors++;
      }
    }
  } else {
    const err12 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err12];
    } else {
      vErrors.push(err12);
    }
    errors++;
  }
  validate82.errors = vErrors;
  return errors === 0;
}
validate82.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
exports.StartInput = validate83;
function validate83(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  ;
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate83.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.hash === void 0) {
      const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "hash" }, message: "must have required property 'hash'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.config === void 0) {
      const err1 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "config" }, message: "must have required property 'config'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    for (const key0 in data) {
      if (!(key0 === "hash" || key0 === "config")) {
        const err2 = { instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
        if (vErrors === null) {
          vErrors = [err2];
        } else {
          vErrors.push(err2);
        }
        errors++;
      }
    }
    if (data.hash !== void 0) {
      if (typeof data.hash !== "string") {
        const err3 = { instancePath: instancePath + "/hash", schemaPath: "#/properties/hash/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err3];
        } else {
          vErrors.push(err3);
        }
        errors++;
      }
    }
  } else {
    const err4 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err4];
    } else {
      vErrors.push(err4);
    }
    errors++;
  }
  validate83.errors = vErrors;
  return errors === 0;
}
validate83.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
exports.StartRequest = validate84;
function validate84(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  ;
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate84.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    for (const key0 in data) {
      if (!(key0 === "subject_ref" || key0 === "question_set_id")) {
        const err0 = { instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
        if (vErrors === null) {
          vErrors = [err0];
        } else {
          vErrors.push(err0);
        }
        errors++;
      }
    }
    if (data.subject_ref !== void 0) {
      let data0 = data.subject_ref;
      const _errs3 = errors;
      let valid1 = false;
      const _errs4 = errors;
      if (typeof data0 === "string") {
        if (!pattern16.test(data0)) {
          const err1 = { instancePath: instancePath + "/subject_ref", schemaPath: "PublicApiRequests.schema.json#/$defs/SessionStartBody/properties/subject_ref/pattern", keyword: "pattern", params: { pattern: "^[A-Za-z0-9._:/#=+-]{1,128}$(?![\\s\\S])" }, message: 'must match pattern "^[A-Za-z0-9._:/#=+-]{1,128}$(?![\\s\\S])"' };
          if (vErrors === null) {
            vErrors = [err1];
          } else {
            vErrors.push(err1);
          }
          errors++;
        }
      } else {
        const err2 = { instancePath: instancePath + "/subject_ref", schemaPath: "PublicApiRequests.schema.json#/$defs/SessionStartBody/properties/subject_ref/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err2];
        } else {
          vErrors.push(err2);
        }
        errors++;
      }
      var _valid0 = _errs4 === errors;
      valid1 = valid1 || _valid0;
      const _errs7 = errors;
      if (data0 !== null) {
        const err3 = { instancePath: instancePath + "/subject_ref", schemaPath: "#/properties/subject_ref/anyOf/1/type", keyword: "type", params: { type: "null" }, message: "must be null" };
        if (vErrors === null) {
          vErrors = [err3];
        } else {
          vErrors.push(err3);
        }
        errors++;
      }
      var _valid0 = _errs7 === errors;
      valid1 = valid1 || _valid0;
      if (!valid1) {
        const err4 = { instancePath: instancePath + "/subject_ref", schemaPath: "#/properties/subject_ref/anyOf", keyword: "anyOf", params: {}, message: "must match a schema in anyOf" };
        if (vErrors === null) {
          vErrors = [err4];
        } else {
          vErrors.push(err4);
        }
        errors++;
      } else {
        errors = _errs3;
        if (vErrors !== null) {
          if (_errs3) {
            vErrors.length = _errs3;
          } else {
            vErrors = null;
          }
        }
      }
    }
    if (data.question_set_id !== void 0) {
      let data1 = data.question_set_id;
      const _errs10 = errors;
      let valid3 = false;
      const _errs11 = errors;
      if (typeof data1 === "string") {
        if (func1(data1) > 128) {
          const err5 = { instancePath: instancePath + "/question_set_id", schemaPath: "DeviceConfig.schema.json#/properties/question_set_id/maxLength", keyword: "maxLength", params: { limit: 128 }, message: "must NOT have more than 128 characters" };
          if (vErrors === null) {
            vErrors = [err5];
          } else {
            vErrors.push(err5);
          }
          errors++;
        }
        if (func1(data1) < 1) {
          const err6 = { instancePath: instancePath + "/question_set_id", schemaPath: "DeviceConfig.schema.json#/properties/question_set_id/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" };
          if (vErrors === null) {
            vErrors = [err6];
          } else {
            vErrors.push(err6);
          }
          errors++;
        }
        if (!pattern7.test(data1)) {
          const err7 = { instancePath: instancePath + "/question_set_id", schemaPath: "DeviceConfig.schema.json#/properties/question_set_id/pattern", keyword: "pattern", params: { pattern: "^[A-Za-z0-9][A-Za-z0-9._:-]*$(?![\\s\\S])" }, message: 'must match pattern "^[A-Za-z0-9][A-Za-z0-9._:-]*$(?![\\s\\S])"' };
          if (vErrors === null) {
            vErrors = [err7];
          } else {
            vErrors.push(err7);
          }
          errors++;
        }
      } else {
        const err8 = { instancePath: instancePath + "/question_set_id", schemaPath: "DeviceConfig.schema.json#/properties/question_set_id/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err8];
        } else {
          vErrors.push(err8);
        }
        errors++;
      }
      var _valid1 = _errs11 === errors;
      valid3 = valid3 || _valid1;
      const _errs14 = errors;
      if (data1 !== null) {
        const err9 = { instancePath: instancePath + "/question_set_id", schemaPath: "#/properties/question_set_id/anyOf/1/type", keyword: "type", params: { type: "null" }, message: "must be null" };
        if (vErrors === null) {
          vErrors = [err9];
        } else {
          vErrors.push(err9);
        }
        errors++;
      }
      var _valid1 = _errs14 === errors;
      valid3 = valid3 || _valid1;
      if (!valid3) {
        const err10 = { instancePath: instancePath + "/question_set_id", schemaPath: "#/properties/question_set_id/anyOf", keyword: "anyOf", params: {}, message: "must match a schema in anyOf" };
        if (vErrors === null) {
          vErrors = [err10];
        } else {
          vErrors.push(err10);
        }
        errors++;
      } else {
        errors = _errs10;
        if (vErrors !== null) {
          if (_errs10) {
            vErrors.length = _errs10;
          } else {
            vErrors = null;
          }
        }
      }
    }
  } else {
    const err11 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err11];
    } else {
      vErrors.push(err11);
    }
    errors++;
  }
  validate84.errors = vErrors;
  return errors === 0;
}
validate84.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
exports.StatusClass = validate85;
function validate85(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  ;
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate85.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.retryable === void 0) {
      const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "retryable" }, message: "must have required property 'retryable'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.outcomeUnknown === void 0) {
      const err1 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "outcomeUnknown" }, message: "must have required property 'outcomeUnknown'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    for (const key0 in data) {
      if (!(key0 === "retryable" || key0 === "outcomeUnknown")) {
        const err2 = { instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
        if (vErrors === null) {
          vErrors = [err2];
        } else {
          vErrors.push(err2);
        }
        errors++;
      }
    }
    if (data.retryable !== void 0) {
      if (typeof data.retryable !== "boolean") {
        const err3 = { instancePath: instancePath + "/retryable", schemaPath: "#/properties/retryable/type", keyword: "type", params: { type: "boolean" }, message: "must be boolean" };
        if (vErrors === null) {
          vErrors = [err3];
        } else {
          vErrors.push(err3);
        }
        errors++;
      }
    }
    if (data.outcomeUnknown !== void 0) {
      if (typeof data.outcomeUnknown !== "boolean") {
        const err4 = { instancePath: instancePath + "/outcomeUnknown", schemaPath: "#/properties/outcomeUnknown/type", keyword: "type", params: { type: "boolean" }, message: "must be boolean" };
        if (vErrors === null) {
          vErrors = [err4];
        } else {
          vErrors.push(err4);
        }
        errors++;
      }
    }
  } else {
    const err5 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err5];
    } else {
      vErrors.push(err5);
    }
    errors++;
  }
  validate85.errors = vErrors;
  return errors === 0;
}
validate85.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
exports.StatusQuery = validate86;
var schema111 = { "$id": "StatusQuery.json", "title": "StatusQuery", "description": "\uC751\uB2F5 \uC0C1\uD0DC \uBD84\uB958 \uC785\uB825: HTTP \uC0C1\uD0DC\uC640 \uC624\uB958 \uBCF8\uBB38 details.reason(\uC5C6\uC73C\uBA74 null).", "type": "object", "properties": { "status": { "type": "integer", "minimum": 100, "maximum": 599 }, "reason": { "type": ["string", "null"] } }, "required": ["status", "reason"], "additionalProperties": false };
function validate86(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  ;
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate86.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.status === void 0) {
      const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "status" }, message: "must have required property 'status'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.reason === void 0) {
      const err1 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "reason" }, message: "must have required property 'reason'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    for (const key0 in data) {
      if (!(key0 === "status" || key0 === "reason")) {
        const err2 = { instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
        if (vErrors === null) {
          vErrors = [err2];
        } else {
          vErrors.push(err2);
        }
        errors++;
      }
    }
    if (data.status !== void 0) {
      let data0 = data.status;
      if (!(typeof data0 == "number" && (!(data0 % 1) && !isNaN(data0)))) {
        const err3 = { instancePath: instancePath + "/status", schemaPath: "#/properties/status/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
        if (vErrors === null) {
          vErrors = [err3];
        } else {
          vErrors.push(err3);
        }
        errors++;
      }
      if (typeof data0 == "number") {
        if (data0 > 599 || isNaN(data0)) {
          const err4 = { instancePath: instancePath + "/status", schemaPath: "#/properties/status/maximum", keyword: "maximum", params: { comparison: "<=", limit: 599 }, message: "must be <= 599" };
          if (vErrors === null) {
            vErrors = [err4];
          } else {
            vErrors.push(err4);
          }
          errors++;
        }
        if (data0 < 100 || isNaN(data0)) {
          const err5 = { instancePath: instancePath + "/status", schemaPath: "#/properties/status/minimum", keyword: "minimum", params: { comparison: ">=", limit: 100 }, message: "must be >= 100" };
          if (vErrors === null) {
            vErrors = [err5];
          } else {
            vErrors.push(err5);
          }
          errors++;
        }
      }
    }
    if (data.reason !== void 0) {
      let data1 = data.reason;
      if (typeof data1 !== "string" && data1 !== null) {
        const err6 = { instancePath: instancePath + "/reason", schemaPath: "#/properties/reason/type", keyword: "type", params: { type: schema111.properties.reason.type }, message: "must be string,null" };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
  } else {
    const err7 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err7];
    } else {
      vErrors.push(err7);
    }
    errors++;
  }
  validate86.errors = vErrors;
  return errors === 0;
}
validate86.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
exports.SttErrorKind = validate87;
var schema112 = { "$id": "SttErrorKind.json", "title": "SttErrorKind", "description": "\uC74C\uC131 \uC778\uC2DD \uC2E4\uD328\uC758 \uC885\uB958(\uC0C1\uD0DC \uAE30\uACC4\uB294 \uC774 \uC5F4\uAC70\uB9CC \uBCF8\uB2E4). BLOCKED = \uB9C8\uC774\uD06C \uAD8C\uD55C\xB7\uC7A5\uCE58 \uBB38\uC81C\uC774\uAC70\uB098 \uC774 \uAE30\uAE30\uC5D0\uC11C \uC74C\uC131 \uC785\uB825 \uBD88\uAC00.", "enum": ["BLOCKED", "NO_SPEECH", "OTHER"] };
function validate87(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  ;
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate87.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (!(data === "BLOCKED" || data === "NO_SPEECH" || data === "OTHER")) {
    const err0 = { instancePath, schemaPath: "#/enum", keyword: "enum", params: { allowedValues: schema112.enum }, message: "must be equal to one of the allowed values" };
    if (vErrors === null) {
      vErrors = [err0];
    } else {
      vErrors.push(err0);
    }
    errors++;
  }
  validate87.errors = vErrors;
  return errors === 0;
}
validate87.evaluated = { "dynamicProps": false, "dynamicItems": false };
exports.SttResult = validate88;
function validate88(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  ;
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate88.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.text === void 0) {
      const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "text" }, message: "must have required property 'text'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.confidence === void 0) {
      const err1 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "confidence" }, message: "must have required property 'confidence'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    for (const key0 in data) {
      if (!(key0 === "text" || key0 === "confidence")) {
        const err2 = { instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
        if (vErrors === null) {
          vErrors = [err2];
        } else {
          vErrors.push(err2);
        }
        errors++;
      }
    }
    if (data.text !== void 0) {
      if (typeof data.text !== "string") {
        const err3 = { instancePath: instancePath + "/text", schemaPath: "#/properties/text/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err3];
        } else {
          vErrors.push(err3);
        }
        errors++;
      }
    }
    if (data.confidence !== void 0) {
      let data1 = data.confidence;
      const _errs5 = errors;
      let valid1 = false;
      const _errs6 = errors;
      if (typeof data1 == "number") {
        if (data1 > 1 || isNaN(data1)) {
          const err4 = { instancePath: instancePath + "/confidence", schemaPath: "#/properties/confidence/anyOf/0/maximum", keyword: "maximum", params: { comparison: "<=", limit: 1 }, message: "must be <= 1" };
          if (vErrors === null) {
            vErrors = [err4];
          } else {
            vErrors.push(err4);
          }
          errors++;
        }
        if (data1 < 0 || isNaN(data1)) {
          const err5 = { instancePath: instancePath + "/confidence", schemaPath: "#/properties/confidence/anyOf/0/minimum", keyword: "minimum", params: { comparison: ">=", limit: 0 }, message: "must be >= 0" };
          if (vErrors === null) {
            vErrors = [err5];
          } else {
            vErrors.push(err5);
          }
          errors++;
        }
      } else {
        const err6 = { instancePath: instancePath + "/confidence", schemaPath: "#/properties/confidence/anyOf/0/type", keyword: "type", params: { type: "number" }, message: "must be number" };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
      var _valid0 = _errs6 === errors;
      valid1 = valid1 || _valid0;
      const _errs8 = errors;
      if (data1 !== null) {
        const err7 = { instancePath: instancePath + "/confidence", schemaPath: "#/properties/confidence/anyOf/1/type", keyword: "type", params: { type: "null" }, message: "must be null" };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
      var _valid0 = _errs8 === errors;
      valid1 = valid1 || _valid0;
      if (!valid1) {
        const err8 = { instancePath: instancePath + "/confidence", schemaPath: "#/properties/confidence/anyOf", keyword: "anyOf", params: {}, message: "must match a schema in anyOf" };
        if (vErrors === null) {
          vErrors = [err8];
        } else {
          vErrors.push(err8);
        }
        errors++;
      } else {
        errors = _errs5;
        if (vErrors !== null) {
          if (_errs5) {
            vErrors.length = _errs5;
          } else {
            vErrors = null;
          }
        }
      }
    }
  } else {
    const err9 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err9];
    } else {
      vErrors.push(err9);
    }
    errors++;
  }
  validate88.errors = vErrors;
  return errors === 0;
}
validate88.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
exports.SyncStatus = validate89;
var schema114 = { "$id": "SyncStatus.json", "title": "SyncStatus", "description": "\uC9C1\uC6D0 \uCF58\uC194 \uC54C\uB9BC \uB3D9\uAE30\uD654 \uC0C1\uD0DC. \uC5F0\uACB0\xB7\uBAA9\uB85D \uC0C1\uD0DC\uB97C \uD56D\uC0C1 \uBC16\uC73C\uB85C \uC54C\uB9B0\uB2E4(\uC870\uC6A9\uD788 \uBE44\uC5B4 \uC788\uB294 \uD654\uBA74 \uAE08\uC9C0).", "type": "object", "properties": { "conn": { "enum": ["CONNECTING", "CONNECTED", "DISCONNECTED"] }, "nextRetryMs": { "type": ["integer", "null"], "minimum": 0 }, "listStale": { "type": "boolean" }, "listLoaded": { "type": "boolean" } }, "required": ["conn", "nextRetryMs", "listStale", "listLoaded"], "additionalProperties": false };
function validate89(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  ;
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate89.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.conn === void 0) {
      const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "conn" }, message: "must have required property 'conn'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.nextRetryMs === void 0) {
      const err1 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "nextRetryMs" }, message: "must have required property 'nextRetryMs'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.listStale === void 0) {
      const err2 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "listStale" }, message: "must have required property 'listStale'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.listLoaded === void 0) {
      const err3 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "listLoaded" }, message: "must have required property 'listLoaded'" };
      if (vErrors === null) {
        vErrors = [err3];
      } else {
        vErrors.push(err3);
      }
      errors++;
    }
    for (const key0 in data) {
      if (!(key0 === "conn" || key0 === "nextRetryMs" || key0 === "listStale" || key0 === "listLoaded")) {
        const err4 = { instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
        if (vErrors === null) {
          vErrors = [err4];
        } else {
          vErrors.push(err4);
        }
        errors++;
      }
    }
    if (data.conn !== void 0) {
      let data0 = data.conn;
      if (!(data0 === "CONNECTING" || data0 === "CONNECTED" || data0 === "DISCONNECTED")) {
        const err5 = { instancePath: instancePath + "/conn", schemaPath: "#/properties/conn/enum", keyword: "enum", params: { allowedValues: schema114.properties.conn.enum }, message: "must be equal to one of the allowed values" };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      }
    }
    if (data.nextRetryMs !== void 0) {
      let data1 = data.nextRetryMs;
      if (!(typeof data1 == "number" && (!(data1 % 1) && !isNaN(data1))) && data1 !== null) {
        const err6 = { instancePath: instancePath + "/nextRetryMs", schemaPath: "#/properties/nextRetryMs/type", keyword: "type", params: { type: schema114.properties.nextRetryMs.type }, message: "must be integer,null" };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
      if (typeof data1 == "number") {
        if (data1 < 0 || isNaN(data1)) {
          const err7 = { instancePath: instancePath + "/nextRetryMs", schemaPath: "#/properties/nextRetryMs/minimum", keyword: "minimum", params: { comparison: ">=", limit: 0 }, message: "must be >= 0" };
          if (vErrors === null) {
            vErrors = [err7];
          } else {
            vErrors.push(err7);
          }
          errors++;
        }
      }
    }
    if (data.listStale !== void 0) {
      if (typeof data.listStale !== "boolean") {
        const err8 = { instancePath: instancePath + "/listStale", schemaPath: "#/properties/listStale/type", keyword: "type", params: { type: "boolean" }, message: "must be boolean" };
        if (vErrors === null) {
          vErrors = [err8];
        } else {
          vErrors.push(err8);
        }
        errors++;
      }
    }
    if (data.listLoaded !== void 0) {
      if (typeof data.listLoaded !== "boolean") {
        const err9 = { instancePath: instancePath + "/listLoaded", schemaPath: "#/properties/listLoaded/type", keyword: "type", params: { type: "boolean" }, message: "must be boolean" };
        if (vErrors === null) {
          vErrors = [err9];
        } else {
          vErrors.push(err9);
        }
        errors++;
      }
    }
  } else {
    const err10 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err10];
    } else {
      vErrors.push(err10);
    }
    errors++;
  }
  validate89.errors = vErrors;
  return errors === 0;
}
validate89.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
exports.UsableTranscript = validate90;
var pattern65 = new RegExp("[^\\s.,?!]", "u");
function validate90(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  ;
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate90.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.text === void 0) {
      const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "text" }, message: "must have required property 'text'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.confidence === void 0) {
      const err1 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "confidence" }, message: "must have required property 'confidence'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    for (const key0 in data) {
      if (!(key0 === "text" || key0 === "confidence")) {
        const err2 = { instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
        if (vErrors === null) {
          vErrors = [err2];
        } else {
          vErrors.push(err2);
        }
        errors++;
      }
    }
    if (data.text !== void 0) {
      let data0 = data.text;
      if (typeof data0 === "string") {
        if (!pattern65.test(data0)) {
          const err3 = { instancePath: instancePath + "/text", schemaPath: "#/properties/text/pattern", keyword: "pattern", params: { pattern: "[^\\s.,?!]" }, message: 'must match pattern "[^\\s.,?!]"' };
          if (vErrors === null) {
            vErrors = [err3];
          } else {
            vErrors.push(err3);
          }
          errors++;
        }
      } else {
        const err4 = { instancePath: instancePath + "/text", schemaPath: "#/properties/text/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err4];
        } else {
          vErrors.push(err4);
        }
        errors++;
      }
    }
    if (data.confidence !== void 0) {
      let data1 = data.confidence;
      const _errs5 = errors;
      let valid1 = false;
      const _errs6 = errors;
      if (typeof data1 == "number") {
        if (data1 > 1 || isNaN(data1)) {
          const err5 = { instancePath: instancePath + "/confidence", schemaPath: "#/properties/confidence/anyOf/0/maximum", keyword: "maximum", params: { comparison: "<=", limit: 1 }, message: "must be <= 1" };
          if (vErrors === null) {
            vErrors = [err5];
          } else {
            vErrors.push(err5);
          }
          errors++;
        }
        if (data1 < 0.4 || isNaN(data1)) {
          const err6 = { instancePath: instancePath + "/confidence", schemaPath: "#/properties/confidence/anyOf/0/minimum", keyword: "minimum", params: { comparison: ">=", limit: 0.4 }, message: "must be >= 0.4" };
          if (vErrors === null) {
            vErrors = [err6];
          } else {
            vErrors.push(err6);
          }
          errors++;
        }
      } else {
        const err7 = { instancePath: instancePath + "/confidence", schemaPath: "#/properties/confidence/anyOf/0/type", keyword: "type", params: { type: "number" }, message: "must be number" };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
      var _valid0 = _errs6 === errors;
      valid1 = valid1 || _valid0;
      const _errs8 = errors;
      if (data1 !== null) {
        const err8 = { instancePath: instancePath + "/confidence", schemaPath: "#/properties/confidence/anyOf/1/type", keyword: "type", params: { type: "null" }, message: "must be null" };
        if (vErrors === null) {
          vErrors = [err8];
        } else {
          vErrors.push(err8);
        }
        errors++;
      }
      var _valid0 = _errs8 === errors;
      valid1 = valid1 || _valid0;
      if (!valid1) {
        const err9 = { instancePath: instancePath + "/confidence", schemaPath: "#/properties/confidence/anyOf", keyword: "anyOf", params: {}, message: "must match a schema in anyOf" };
        if (vErrors === null) {
          vErrors = [err9];
        } else {
          vErrors.push(err9);
        }
        errors++;
      } else {
        errors = _errs5;
        if (vErrors !== null) {
          if (_errs5) {
            vErrors.length = _errs5;
          } else {
            vErrors = null;
          }
        }
      }
    }
  } else {
    const err10 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err10];
    } else {
      vErrors.push(err10);
    }
    errors++;
  }
  validate90.errors = vErrors;
  return errors === 0;
}
validate90.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
exports.UtteranceRequest = validate91;
function validate92(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate92.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (typeof data === "string") {
    if (func1(data) > 128) {
      const err0 = { instancePath, schemaPath: "#/$defs/Id/maxLength", keyword: "maxLength", params: { limit: 128 }, message: "must NOT have more than 128 characters" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (func1(data) < 1) {
      const err1 = { instancePath, schemaPath: "#/$defs/Id/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (!pattern7.test(data)) {
      const err2 = { instancePath, schemaPath: "#/$defs/Id/pattern", keyword: "pattern", params: { pattern: "^[A-Za-z0-9][A-Za-z0-9._:-]*$(?![\\s\\S])" }, message: 'must match pattern "^[A-Za-z0-9][A-Za-z0-9._:-]*$(?![\\s\\S])"' };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
  } else {
    const err3 = { instancePath, schemaPath: "#/$defs/Id/type", keyword: "type", params: { type: "string" }, message: "must be string" };
    if (vErrors === null) {
      vErrors = [err3];
    } else {
      vErrors.push(err3);
    }
    errors++;
  }
  if (typeof data === "string") {
    if (func1(data) > 64) {
      const err4 = { instancePath, schemaPath: "#/maxLength", keyword: "maxLength", params: { limit: 64 }, message: "must NOT have more than 64 characters" };
      if (vErrors === null) {
        vErrors = [err4];
      } else {
        vErrors.push(err4);
      }
      errors++;
    }
    if (!pattern8.test(data)) {
      const err5 = { instancePath, schemaPath: "#/pattern", keyword: "pattern", params: { pattern: "^[A-Za-z0-9_-]*$(?![\\s\\S])" }, message: 'must match pattern "^[A-Za-z0-9_-]*$(?![\\s\\S])"' };
      if (vErrors === null) {
        vErrors = [err5];
      } else {
        vErrors.push(err5);
      }
      errors++;
    }
  }
  validate92.errors = vErrors;
  return errors === 0;
}
validate92.evaluated = { "dynamicProps": false, "dynamicItems": false };
function validate91(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  ;
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate91.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.session_id === void 0) {
      const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "session_id" }, message: "must have required property 'session_id'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.utterance === void 0) {
      const err1 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "utterance" }, message: "must have required property 'utterance'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.turn_id === void 0) {
      const err2 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "turn_id" }, message: "must have required property 'turn_id'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    for (const key0 in data) {
      if (!(key0 === "session_id" || key0 === "utterance" || key0 === "turn_id")) {
        const err3 = { instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
        if (vErrors === null) {
          vErrors = [err3];
        } else {
          vErrors.push(err3);
        }
        errors++;
      }
    }
    if (data.session_id !== void 0) {
      if (!validate92(data.session_id, { instancePath: instancePath + "/session_id", parentData: data, parentDataProperty: "session_id", rootData, dynamicAnchors })) {
        vErrors = vErrors === null ? validate92.errors : vErrors.concat(validate92.errors);
        errors = vErrors.length;
      }
    }
    if (data.utterance !== void 0) {
      let data1 = data.utterance;
      if (typeof data1 === "string") {
        if (func1(data1) > 1e3) {
          const err4 = { instancePath: instancePath + "/utterance", schemaPath: "PublicApiRequests.schema.json#/$defs/UtteranceBody/properties/utterance/maxLength", keyword: "maxLength", params: { limit: 1e3 }, message: "must NOT have more than 1000 characters" };
          if (vErrors === null) {
            vErrors = [err4];
          } else {
            vErrors.push(err4);
          }
          errors++;
        }
        if (!pattern4.test(data1)) {
          const err5 = { instancePath: instancePath + "/utterance", schemaPath: "PublicApiRequests.schema.json#/$defs/UtteranceBody/properties/utterance/pattern", keyword: "pattern", params: { pattern: "\\S" }, message: 'must match pattern "\\S"' };
          if (vErrors === null) {
            vErrors = [err5];
          } else {
            vErrors.push(err5);
          }
          errors++;
        }
      } else {
        const err6 = { instancePath: instancePath + "/utterance", schemaPath: "PublicApiRequests.schema.json#/$defs/UtteranceBody/properties/utterance/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
    if (data.turn_id !== void 0) {
      let data2 = data.turn_id;
      if (typeof data2 === "string") {
        if (func1(data2) > 128) {
          const err7 = { instancePath: instancePath + "/turn_id", schemaPath: "StaffCallReport.schema.json#/properties/turn_id/maxLength", keyword: "maxLength", params: { limit: 128 }, message: "must NOT have more than 128 characters" };
          if (vErrors === null) {
            vErrors = [err7];
          } else {
            vErrors.push(err7);
          }
          errors++;
        }
        if (func1(data2) < 1) {
          const err8 = { instancePath: instancePath + "/turn_id", schemaPath: "StaffCallReport.schema.json#/properties/turn_id/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" };
          if (vErrors === null) {
            vErrors = [err8];
          } else {
            vErrors.push(err8);
          }
          errors++;
        }
        if (!pattern7.test(data2)) {
          const err9 = { instancePath: instancePath + "/turn_id", schemaPath: "StaffCallReport.schema.json#/properties/turn_id/pattern", keyword: "pattern", params: { pattern: "^[A-Za-z0-9][A-Za-z0-9._:-]*$(?![\\s\\S])" }, message: 'must match pattern "^[A-Za-z0-9][A-Za-z0-9._:-]*$(?![\\s\\S])"' };
          if (vErrors === null) {
            vErrors = [err9];
          } else {
            vErrors.push(err9);
          }
          errors++;
        }
      } else {
        const err10 = { instancePath: instancePath + "/turn_id", schemaPath: "StaffCallReport.schema.json#/properties/turn_id/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err10];
        } else {
          vErrors.push(err10);
        }
        errors++;
      }
    }
  } else {
    const err11 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err11];
    } else {
      vErrors.push(err11);
    }
    errors++;
  }
  validate91.errors = vErrors;
  return errors === 0;
}
validate91.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
exports.UtteranceText = validate94;
function validate94(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  ;
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate94.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (typeof data === "string") {
    if (func1(data) > 1e3) {
      const err0 = { instancePath, schemaPath: "PublicApiRequests.schema.json#/$defs/UtteranceBody/properties/utterance/maxLength", keyword: "maxLength", params: { limit: 1e3 }, message: "must NOT have more than 1000 characters" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (!pattern4.test(data)) {
      const err1 = { instancePath, schemaPath: "PublicApiRequests.schema.json#/$defs/UtteranceBody/properties/utterance/pattern", keyword: "pattern", params: { pattern: "\\S" }, message: 'must match pattern "\\S"' };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
  } else {
    const err2 = { instancePath, schemaPath: "PublicApiRequests.schema.json#/$defs/UtteranceBody/properties/utterance/type", keyword: "type", params: { type: "string" }, message: "must be string" };
    if (vErrors === null) {
      vErrors = [err2];
    } else {
      vErrors.push(err2);
    }
    errors++;
  }
  validate94.errors = vErrors;
  return errors === 0;
}
validate94.evaluated = { "dynamicProps": false, "dynamicItems": false };
exports.DeviceConfig = validate63;
function validate63(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  ;
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate63.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    for (const key0 in data) {
      if (!(key0 === "allow_remote_stt" || key0 === "question_set_id")) {
        const err0 = { instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
        if (vErrors === null) {
          vErrors = [err0];
        } else {
          vErrors.push(err0);
        }
        errors++;
      }
    }
    if (data.allow_remote_stt !== void 0) {
      if (typeof data.allow_remote_stt !== "boolean") {
        const err1 = { instancePath: instancePath + "/allow_remote_stt", schemaPath: "#/properties/allow_remote_stt/type", keyword: "type", params: { type: "boolean" }, message: "must be boolean" };
        if (vErrors === null) {
          vErrors = [err1];
        } else {
          vErrors.push(err1);
        }
        errors++;
      }
    }
    if (data.question_set_id !== void 0) {
      let data1 = data.question_set_id;
      if (typeof data1 === "string") {
        if (func1(data1) > 128) {
          const err2 = { instancePath: instancePath + "/question_set_id", schemaPath: "_common.schema.json#/$defs/Id/maxLength", keyword: "maxLength", params: { limit: 128 }, message: "must NOT have more than 128 characters" };
          if (vErrors === null) {
            vErrors = [err2];
          } else {
            vErrors.push(err2);
          }
          errors++;
        }
        if (func1(data1) < 1) {
          const err3 = { instancePath: instancePath + "/question_set_id", schemaPath: "_common.schema.json#/$defs/Id/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" };
          if (vErrors === null) {
            vErrors = [err3];
          } else {
            vErrors.push(err3);
          }
          errors++;
        }
        if (!pattern7.test(data1)) {
          const err4 = { instancePath: instancePath + "/question_set_id", schemaPath: "_common.schema.json#/$defs/Id/pattern", keyword: "pattern", params: { pattern: "^[A-Za-z0-9][A-Za-z0-9._:-]*$(?![\\s\\S])" }, message: 'must match pattern "^[A-Za-z0-9][A-Za-z0-9._:-]*$(?![\\s\\S])"' };
          if (vErrors === null) {
            vErrors = [err4];
          } else {
            vErrors.push(err4);
          }
          errors++;
        }
      } else {
        const err5 = { instancePath: instancePath + "/question_set_id", schemaPath: "_common.schema.json#/$defs/Id/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      }
    }
  } else {
    const err6 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err6];
    } else {
      vErrors.push(err6);
    }
    errors++;
  }
  validate63.errors = vErrors;
  return errors === 0;
}
validate63.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
exports.KioskStartFragment = validate95;
function validate95(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  ;
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate95.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    for (const key0 in data) {
      if (!(key0 === "subject_ref" || key0 === "question_set_id")) {
        const err0 = { instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
        if (vErrors === null) {
          vErrors = [err0];
        } else {
          vErrors.push(err0);
        }
        errors++;
      }
    }
    if (data.subject_ref !== void 0) {
      let data0 = data.subject_ref;
      if (typeof data0 === "string") {
        if (!pattern16.test(data0)) {
          const err1 = { instancePath: instancePath + "/subject_ref", schemaPath: "PublicApiRequests.schema.json#/$defs/SessionStartBody/properties/subject_ref/pattern", keyword: "pattern", params: { pattern: "^[A-Za-z0-9._:/#=+-]{1,128}$(?![\\s\\S])" }, message: 'must match pattern "^[A-Za-z0-9._:/#=+-]{1,128}$(?![\\s\\S])"' };
          if (vErrors === null) {
            vErrors = [err1];
          } else {
            vErrors.push(err1);
          }
          errors++;
        }
      } else {
        const err2 = { instancePath: instancePath + "/subject_ref", schemaPath: "PublicApiRequests.schema.json#/$defs/SessionStartBody/properties/subject_ref/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err2];
        } else {
          vErrors.push(err2);
        }
        errors++;
      }
    }
    if (data.question_set_id !== void 0) {
      let data1 = data.question_set_id;
      if (typeof data1 === "string") {
        if (func1(data1) > 128) {
          const err3 = { instancePath: instancePath + "/question_set_id", schemaPath: "DeviceConfig.schema.json#/properties/question_set_id/maxLength", keyword: "maxLength", params: { limit: 128 }, message: "must NOT have more than 128 characters" };
          if (vErrors === null) {
            vErrors = [err3];
          } else {
            vErrors.push(err3);
          }
          errors++;
        }
        if (func1(data1) < 1) {
          const err4 = { instancePath: instancePath + "/question_set_id", schemaPath: "DeviceConfig.schema.json#/properties/question_set_id/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" };
          if (vErrors === null) {
            vErrors = [err4];
          } else {
            vErrors.push(err4);
          }
          errors++;
        }
        if (!pattern7.test(data1)) {
          const err5 = { instancePath: instancePath + "/question_set_id", schemaPath: "DeviceConfig.schema.json#/properties/question_set_id/pattern", keyword: "pattern", params: { pattern: "^[A-Za-z0-9][A-Za-z0-9._:-]*$(?![\\s\\S])" }, message: 'must match pattern "^[A-Za-z0-9][A-Za-z0-9._:-]*$(?![\\s\\S])"' };
          if (vErrors === null) {
            vErrors = [err5];
          } else {
            vErrors.push(err5);
          }
          errors++;
        }
      } else {
        const err6 = { instancePath: instancePath + "/question_set_id", schemaPath: "DeviceConfig.schema.json#/properties/question_set_id/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
  } else {
    const err7 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err7];
    } else {
      vErrors.push(err7);
    }
    errors++;
  }
  validate95.errors = vErrors;
  return errors === 0;
}
validate95.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
exports.StaffPushPayload = validate96;
function validate97(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate97.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (typeof data === "string") {
    if (func1(data) > 128) {
      const err0 = { instancePath, schemaPath: "#/$defs/Id/maxLength", keyword: "maxLength", params: { limit: 128 }, message: "must NOT have more than 128 characters" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (func1(data) < 1) {
      const err1 = { instancePath, schemaPath: "#/$defs/Id/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (!pattern7.test(data)) {
      const err2 = { instancePath, schemaPath: "#/$defs/Id/pattern", keyword: "pattern", params: { pattern: "^[A-Za-z0-9][A-Za-z0-9._:-]*$(?![\\s\\S])" }, message: 'must match pattern "^[A-Za-z0-9][A-Za-z0-9._:-]*$(?![\\s\\S])"' };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
  } else {
    const err3 = { instancePath, schemaPath: "#/$defs/Id/type", keyword: "type", params: { type: "string" }, message: "must be string" };
    if (vErrors === null) {
      vErrors = [err3];
    } else {
      vErrors.push(err3);
    }
    errors++;
  }
  if (typeof data === "string") {
    if (func1(data) > 64) {
      const err4 = { instancePath, schemaPath: "#/maxLength", keyword: "maxLength", params: { limit: 64 }, message: "must NOT have more than 64 characters" };
      if (vErrors === null) {
        vErrors = [err4];
      } else {
        vErrors.push(err4);
      }
      errors++;
    }
    if (!pattern8.test(data)) {
      const err5 = { instancePath, schemaPath: "#/pattern", keyword: "pattern", params: { pattern: "^[A-Za-z0-9_-]*$(?![\\s\\S])" }, message: 'must match pattern "^[A-Za-z0-9_-]*$(?![\\s\\S])"' };
      if (vErrors === null) {
        vErrors = [err5];
      } else {
        vErrors.push(err5);
      }
      errors++;
    }
  }
  validate97.errors = vErrors;
  return errors === 0;
}
validate97.evaluated = { "dynamicProps": false, "dynamicItems": false };
function validate96(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  ;
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate96.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.session_id === void 0) {
      const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "session_id" }, message: "must have required property 'session_id'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    for (const key0 in data) {
      if (!(key0 === "session_id" || key0 === "kind" || key0 === "alert_id")) {
        const err1 = { instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
        if (vErrors === null) {
          vErrors = [err1];
        } else {
          vErrors.push(err1);
        }
        errors++;
      }
    }
    if (data.session_id !== void 0) {
      if (!validate97(data.session_id, { instancePath: instancePath + "/session_id", parentData: data, parentDataProperty: "session_id", rootData, dynamicAnchors })) {
        vErrors = vErrors === null ? validate97.errors : vErrors.concat(validate97.errors);
        errors = vErrors.length;
      }
    }
    if (data.kind !== void 0) {
      let data1 = data.kind;
      if (typeof data1 === "string") {
        if (func1(data1) < 1) {
          const err2 = { instancePath: instancePath + "/kind", schemaPath: "#/properties/kind/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" };
          if (vErrors === null) {
            vErrors = [err2];
          } else {
            vErrors.push(err2);
          }
          errors++;
        }
      } else {
        const err3 = { instancePath: instancePath + "/kind", schemaPath: "#/properties/kind/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err3];
        } else {
          vErrors.push(err3);
        }
        errors++;
      }
    }
    if (data.alert_id !== void 0) {
      let data2 = data.alert_id;
      if (typeof data2 === "string") {
        if (func1(data2) > 128) {
          const err4 = { instancePath: instancePath + "/alert_id", schemaPath: "_common.schema.json#/$defs/Id/maxLength", keyword: "maxLength", params: { limit: 128 }, message: "must NOT have more than 128 characters" };
          if (vErrors === null) {
            vErrors = [err4];
          } else {
            vErrors.push(err4);
          }
          errors++;
        }
        if (func1(data2) < 1) {
          const err5 = { instancePath: instancePath + "/alert_id", schemaPath: "_common.schema.json#/$defs/Id/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" };
          if (vErrors === null) {
            vErrors = [err5];
          } else {
            vErrors.push(err5);
          }
          errors++;
        }
        if (!pattern7.test(data2)) {
          const err6 = { instancePath: instancePath + "/alert_id", schemaPath: "_common.schema.json#/$defs/Id/pattern", keyword: "pattern", params: { pattern: "^[A-Za-z0-9][A-Za-z0-9._:-]*$(?![\\s\\S])" }, message: 'must match pattern "^[A-Za-z0-9][A-Za-z0-9._:-]*$(?![\\s\\S])"' };
          if (vErrors === null) {
            vErrors = [err6];
          } else {
            vErrors.push(err6);
          }
          errors++;
        }
      } else {
        const err7 = { instancePath: instancePath + "/alert_id", schemaPath: "_common.schema.json#/$defs/Id/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
    }
  } else {
    const err8 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err8];
    } else {
      vErrors.push(err8);
    }
    errors++;
  }
  validate96.errors = vErrors;
  return errors === 0;
}
validate96.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
exports.StaffCallReport = validate35;
var schema47 = { "title": "StaffCallReport", "description": "POST /v1/sessions/{id}/staff-call/report \uBCF8\uBB38(2.1.0, CR-H001). \uD0A4\uC624\uC2A4\uD06C\uC758 '\uC9C1\uC811 \uC54C\uB9AC\uC168\uB098\uC694?' \uC751\uB2F5\uC744 \uC11C\uBC84\uC5D0 \uB0A8\uAE34\uB2E4.", "x-producers": ["kiosk-frontend"], "x-consumers": ["survey-service"], "type": "object", "additionalProperties": false, "required": ["outcome", "turn_id"], "properties": { "outcome": { "enum": ["STAFF_NOTIFIED_MANUALLY", "NOT_NOTIFIED"] }, "turn_id": { "$ref": "_common.schema.json#/$defs/Id", "description": "\uD134 ID(\uACF5\uAC1C \uC785\uAD6C turn_id \uC640 \uAC19\uC740 Id). 5.0.0: 64\uC790 \uC0C1\uD55C \uC0AC\uBCF8\uC744 Id(128) \uCC38\uC870\uB85C \uBC14\uAFE8\uB2E4(D117)." } }, "$id": "https://openit.example/contracts/v5/StaffCallReport.schema.json" };
function validate35(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  ;
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate35.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.outcome === void 0) {
      const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "outcome" }, message: "must have required property 'outcome'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.turn_id === void 0) {
      const err1 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "turn_id" }, message: "must have required property 'turn_id'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    for (const key0 in data) {
      if (!(key0 === "outcome" || key0 === "turn_id")) {
        const err2 = { instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
        if (vErrors === null) {
          vErrors = [err2];
        } else {
          vErrors.push(err2);
        }
        errors++;
      }
    }
    if (data.outcome !== void 0) {
      let data0 = data.outcome;
      if (!(data0 === "STAFF_NOTIFIED_MANUALLY" || data0 === "NOT_NOTIFIED")) {
        const err3 = { instancePath: instancePath + "/outcome", schemaPath: "#/properties/outcome/enum", keyword: "enum", params: { allowedValues: schema47.properties.outcome.enum }, message: "must be equal to one of the allowed values" };
        if (vErrors === null) {
          vErrors = [err3];
        } else {
          vErrors.push(err3);
        }
        errors++;
      }
    }
    if (data.turn_id !== void 0) {
      let data1 = data.turn_id;
      if (typeof data1 === "string") {
        if (func1(data1) > 128) {
          const err4 = { instancePath: instancePath + "/turn_id", schemaPath: "_common.schema.json#/$defs/Id/maxLength", keyword: "maxLength", params: { limit: 128 }, message: "must NOT have more than 128 characters" };
          if (vErrors === null) {
            vErrors = [err4];
          } else {
            vErrors.push(err4);
          }
          errors++;
        }
        if (func1(data1) < 1) {
          const err5 = { instancePath: instancePath + "/turn_id", schemaPath: "_common.schema.json#/$defs/Id/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" };
          if (vErrors === null) {
            vErrors = [err5];
          } else {
            vErrors.push(err5);
          }
          errors++;
        }
        if (!pattern7.test(data1)) {
          const err6 = { instancePath: instancePath + "/turn_id", schemaPath: "_common.schema.json#/$defs/Id/pattern", keyword: "pattern", params: { pattern: "^[A-Za-z0-9][A-Za-z0-9._:-]*$(?![\\s\\S])" }, message: 'must match pattern "^[A-Za-z0-9][A-Za-z0-9._:-]*$(?![\\s\\S])"' };
          if (vErrors === null) {
            vErrors = [err6];
          } else {
            vErrors.push(err6);
          }
          errors++;
        }
      } else {
        const err7 = { instancePath: instancePath + "/turn_id", schemaPath: "_common.schema.json#/$defs/Id/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
    }
  } else {
    const err8 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err8];
    } else {
      vErrors.push(err8);
    }
    errors++;
  }
  validate35.errors = vErrors;
  return errors === 0;
}
validate35.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
exports.StaffCallRetryRequest = validate51;
function validate51(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  ;
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate51.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.turn_id === void 0) {
      const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "turn_id" }, message: "must have required property 'turn_id'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    for (const key0 in data) {
      if (!(key0 === "turn_id")) {
        const err1 = { instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
        if (vErrors === null) {
          vErrors = [err1];
        } else {
          vErrors.push(err1);
        }
        errors++;
      }
    }
    if (data.turn_id !== void 0) {
      let data0 = data.turn_id;
      if (typeof data0 === "string") {
        if (func1(data0) > 128) {
          const err2 = { instancePath: instancePath + "/turn_id", schemaPath: "_common.schema.json#/$defs/Id/maxLength", keyword: "maxLength", params: { limit: 128 }, message: "must NOT have more than 128 characters" };
          if (vErrors === null) {
            vErrors = [err2];
          } else {
            vErrors.push(err2);
          }
          errors++;
        }
        if (func1(data0) < 1) {
          const err3 = { instancePath: instancePath + "/turn_id", schemaPath: "_common.schema.json#/$defs/Id/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" };
          if (vErrors === null) {
            vErrors = [err3];
          } else {
            vErrors.push(err3);
          }
          errors++;
        }
        if (!pattern7.test(data0)) {
          const err4 = { instancePath: instancePath + "/turn_id", schemaPath: "_common.schema.json#/$defs/Id/pattern", keyword: "pattern", params: { pattern: "^[A-Za-z0-9][A-Za-z0-9._:-]*$(?![\\s\\S])" }, message: 'must match pattern "^[A-Za-z0-9][A-Za-z0-9._:-]*$(?![\\s\\S])"' };
          if (vErrors === null) {
            vErrors = [err4];
          } else {
            vErrors.push(err4);
          }
          errors++;
        }
      } else {
        const err5 = { instancePath: instancePath + "/turn_id", schemaPath: "_common.schema.json#/$defs/Id/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      }
    }
  } else {
    const err6 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err6];
    } else {
      vErrors.push(err6);
    }
    errors++;
  }
  validate51.errors = vErrors;
  return errors === 0;
}
validate51.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
exports.PushSubscriptionRequest = validate57;
var schema69 = { "$id": "https://openit.example/contracts/v5/PushSubscriptionRequest.schema.json", "title": "PushSubscriptionRequest", "description": "3.4.4(\uAC80\uD1A0 B-28-5\xB7B-24): POST /v1/staff/push-subscriptions \uBCF8\uBB38. \uBE0C\uB77C\uC6B0\uC800 PushSubscription.toJSON() \uC758 endpoint\xB7keys \uC640 \uC120\uD0DD topics. endpoint \uB294 https \uC774\uACE0 \uD3EC\uD2B8\uAC00 \uC5C6\uAC70\uB098 443 \uC774\uBA70 \uD638\uC2A4\uD2B8\uAC00 \uACF5\uC778 \uC8FC\uC18C\uB85C \uD574\uC11D\uB420 \uB54C\uB9CC \uBC1B\uB294\uB2E4(loopback\xB7\uC0AC\uC124\xB7\uB9C1\uD06C\uB85C\uCEEC\xB7\uD2B9\uC218 \uC8FC\uC18C\uB294 400 INVALID_RECORD \u2014 SSRF \uBC29\uC9C0, OWASP A10:2021). \uD638\uC2A4\uD2B8\uB294 \uC810\uC774 \uC788\uB294 \uC774\uB984\uC774\uC5B4\uC57C \uD558\uACE0 IP \uB9AC\uD130\uB7F4\xB7localhost \uB294 \uC2A4\uD0A4\uB9C8\uC5D0\uC11C \uAC70\uBD80\uD55C\uB2E4(\uAC80\uD1A0 P6-R6-15). \uC774\uB984\uC774 RFC 6890 \uD2B9\uC218 \uBAA9\uC801 \uC8FC\uC18C\uB85C \uD574\uC11D\uB418\uB294\uC9C0\uB294 \uC2A4\uD0A4\uB9C8\uB85C \uBABB \uC4F0\uBBC0\uB85C \uC11C\uBC84\uAC00 \uB4F1\uB85D \uB54C\uC640 \uBC1C\uC1A1 \uB54C \uD55C\uB2E4(RUNTIME R3.18). 3.7.0: \uAC19\uC740 \uBCF8\uBB38\uC744 \uC11C\uBC84(openapi: PublicApiRequests.PushSubscribeBody)\uC640 \uC0DD\uC0B0\uC790(kiosk-frontend\xB7admin-console)\uAC00 \uC11C\uB85C \uB2E4\uB978 \uC2A4\uD0A4\uB9C8\uB85C \uAC80\uC99D\uD558\uB358 \uAC83\uC744 \uC774 \uC2A4\uD0A4\uB9C8 \uD558\uB098\uB85C \uD569\uCCE4\uB2E4(PushSubscribeBody \uB294 \uC774\uAC83\uC744 \uCC38\uC870\uD55C\uB2E4). PushSubscription.toJSON() \uC758 expirationTime \uB4F1 \uADF8 \uBC16\uC758 \uD0A4\uB294 \uC0DD\uC0B0\uC790\uAC00 \uBE7C\uACE0 \uBCF4\uB0B8\uB2E4(\uB2EB\uD78C \uBCF8\uBB38).", "x-producers": ["kiosk-frontend", "admin-console"], "x-consumers": ["survey-service"], "type": "object", "required": ["endpoint", "keys"], "additionalProperties": false, "properties": { "endpoint": { "type": "string", "maxLength": 2048, "pattern": "^https://(?=[^/:]*[A-Za-z])[A-Za-z0-9-]+(\\.[A-Za-z0-9-]+)+(:443)?/[\\x21-\\x7E]*$(?![\\s\\S])", "allOf": [{ "not": { "pattern": "^https://[lL][oO][cC][aA][lL][hH][oO][sS][tT]\\.?(:443)?([/?#]|$(?![\\s\\S]))" } }, { "not": { "pattern": "^https://[^/?#@:\\s]*\\.([lL][oO][cC][aA][lL]|[lL][oO][cC][aA][lL][dD][oO][mM][aA][iI][nN]|[iI][nN][tT][eE][rR][nN][aA][lL]|[lL][aA][nN]|[hH][oO][mM][eE]|[cC][oO][rR][pP]|[iI][nN][tT][rR][aA][nN][eE][tT])\\.?(:443)?([/?#]|$(?![\\s\\S]))" } }], "description": "\uC6F9 \uD478\uC2DC endpoint(PushSubscription.endpoint). https, \uD3EC\uD2B8 \uC5C6\uC74C \uB610\uB294 443, \uC810\uC774 \uC788\uB294 \uC774\uB984 \uD638\uC2A4\uD2B8(IP \uB9AC\uD130\uB7F4\xB7localhost\xB7.local/.localdomain/.internal/.lan/.home/.corp/.intranet \uAC70\uBD80), \uACBD\uB85C\uAC00 \uC788\uACE0 \uACF5\uBC31\uC774 \uC5C6\uB2E4. 3.7.0: PublicApiRequests.PushSubscribeBody \uC640 \uB458\uB85C \uAC08\uB77C\uC838 \uC788\uB358 \uC81C\uC57D\uC744 \uC5EC\uAE30 \uD558\uB098\uB85C \uD569\uCCE4\uB2E4 \uADFC\uAC70: \uC0C1\uD55C 2048 \uC740 \uBE0C\uB77C\uC6B0\uC800\xB7\uD504\uB85D\uC2DC\uAC00 \uB118\uAE30\uB294 URL \uAE38\uC774\uC758 \uAD00\uB840\uC801 \uD558\uD55C(\uCE21\uC815 \uC548 \uD568) 5.0.0: \uACBD\uB85C\uB294 ASCII \uD45C\uC2DC \uBB38\uC790\uB9CC(RFC 3986 2\uC808: URI \uB294 ASCII, \uBE44ASCII \uB294 \uD37C\uC13C\uD2B8 \uC778\uCF54\uB529)\uC774\uACE0 format uri(RFC 3986 URI \uBB38\uBC95, rfc3986-validator \uB97C format_checker \uAC00 \uAC15\uC81C)\uB97C \uD568\uAED8 \uAC74\uB2E4. \uAC15\uC81C \uBC94\uC704\uB294 \uC774 \uB450 \uAC80\uC0AC\uC640 \uC704 \uD328\uD134\uAE4C\uC9C0\uB2E4(\uC2A4\uD0B4\xB7\uD638\uC2A4\uD2B8 \uC758\uBBF8 \uAC80\uC0AC\uB294 \uD328\uD134 \uBAAB). \uBE44ASCII \uACBD\uB85C\uAC00 \uC800\uC7A5\uC18C \uD0A4 \uC0C1\uD55C\uC744 \uB118\uACA8 5xx \uAC00 \uB418\uB358 \uAC83\uC744 \uB9C9\uB294\uB2E4(\uACB0\uD568 \uB300\uC7A5 #10).", "format": "uri" }, "keys": { "type": "object", "required": ["p256dh", "auth"], "additionalProperties": false, "properties": { "p256dh": { "type": "string", "pattern": "^[A-Za-z0-9_-]+=*$(?![\\s\\S])", "maxLength": 200, "description": "\uADFC\uAC70: RFC 8291: P-256 \uACF5\uAC1C\uD0A4 65\uBC14\uC774\uD2B8 = base64url 87\uC790. \uC0C1\uD55C 200 \uC740 \uC5EC\uC720\uB97C \uB454 \uC124\uACC4\uAC12" }, "auth": { "type": "string", "pattern": "^[A-Za-z0-9_-]+=*$(?![\\s\\S])", "maxLength": 64, "description": "\uADFC\uAC70: RFC 8291: \uC778\uC99D \uBE44\uBC00 16\uBC14\uC774\uD2B8 = base64url 22\uC790. \uC0C1\uD55C 64 \uB294 \uC5EC\uC720\uB97C \uB454 \uC124\uACC4\uAC12" } }, "description": "W3C Push API PushSubscriptionKeys \uC758 p256dh(P-256 \uACF5\uAC1C\uD0A4, base64url)\xB7auth(\uC778\uC99D \uBE44\uBC00, base64url). \uC774 \uB458\uB9CC \uBCF4\uB0B8\uB2E4" }, "topics": { "type": "array", "minItems": 1, "uniqueItems": true, "items": { "enum": ["alerts", "results"] }, "description": '\uAD6C\uB3C5 \uC8FC\uC81C(\uACC4\uC57D 3.4.0). alerts=\uC9C1\uC6D0 \uC54C\uB9BC(staff \uC5ED\uD560), results=\uACB0\uACFC \uB3C4\uCC29(clinician \uC5ED\uD560=result-reader \uD1A0\uD070). \uC5C6\uC73C\uBA74 ["alerts"]. \uC5ED\uD560 \uD655\uC778\uC740 \uC11C\uBE44\uC2A4\uAC00 \uD55C\uB2E4.', "maxItems": 2 } } };
var pattern27 = new RegExp("^https://[lL][oO][cC][aA][lL][hH][oO][sS][tT]\\.?(:443)?([/?#]|$(?![\\s\\S]))", "u");
var pattern28 = new RegExp("^https://[^/?#@:\\s]*\\.([lL][oO][cC][aA][lL]|[lL][oO][cC][aA][lL][dD][oO][mM][aA][iI][nN]|[iI][nN][tT][eE][rR][nN][aA][lL]|[lL][aA][nN]|[hH][oO][mM][eE]|[cC][oO][rR][pP]|[iI][nN][tT][rR][aA][nN][eE][tT])\\.?(:443)?([/?#]|$(?![\\s\\S]))", "u");
var pattern29 = new RegExp("^https://(?=[^/:]*[A-Za-z])[A-Za-z0-9-]+(\\.[A-Za-z0-9-]+)+(:443)?/[\\x21-\\x7E]*$(?![\\s\\S])", "u");
var pattern30 = new RegExp("^[A-Za-z0-9_-]+=*$(?![\\s\\S])", "u");
var formats0 = require_formats().fullFormats.uri;
var func0 = require_equal().default;
function validate57(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  ;
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate57.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.endpoint === void 0) {
      const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "endpoint" }, message: "must have required property 'endpoint'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.keys === void 0) {
      const err1 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "keys" }, message: "must have required property 'keys'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    for (const key0 in data) {
      if (!(key0 === "endpoint" || key0 === "keys" || key0 === "topics")) {
        const err2 = { instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
        if (vErrors === null) {
          vErrors = [err2];
        } else {
          vErrors.push(err2);
        }
        errors++;
      }
    }
    if (data.endpoint !== void 0) {
      let data0 = data.endpoint;
      const _errs5 = errors;
      const _errs6 = errors;
      if (typeof data0 === "string") {
        if (!pattern27.test(data0)) {
          const err3 = {};
          if (vErrors === null) {
            vErrors = [err3];
          } else {
            vErrors.push(err3);
          }
          errors++;
        }
      }
      var valid2 = _errs6 === errors;
      if (valid2) {
        const err4 = { instancePath: instancePath + "/endpoint", schemaPath: "#/properties/endpoint/allOf/0/not", keyword: "not", params: {}, message: "must NOT be valid" };
        if (vErrors === null) {
          vErrors = [err4];
        } else {
          vErrors.push(err4);
        }
        errors++;
      } else {
        errors = _errs5;
        if (vErrors !== null) {
          if (_errs5) {
            vErrors.length = _errs5;
          } else {
            vErrors = null;
          }
        }
      }
      const _errs8 = errors;
      const _errs9 = errors;
      if (typeof data0 === "string") {
        if (!pattern28.test(data0)) {
          const err5 = {};
          if (vErrors === null) {
            vErrors = [err5];
          } else {
            vErrors.push(err5);
          }
          errors++;
        }
      }
      var valid3 = _errs9 === errors;
      if (valid3) {
        const err6 = { instancePath: instancePath + "/endpoint", schemaPath: "#/properties/endpoint/allOf/1/not", keyword: "not", params: {}, message: "must NOT be valid" };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      } else {
        errors = _errs8;
        if (vErrors !== null) {
          if (_errs8) {
            vErrors.length = _errs8;
          } else {
            vErrors = null;
          }
        }
      }
      if (typeof data0 === "string") {
        if (func1(data0) > 2048) {
          const err7 = { instancePath: instancePath + "/endpoint", schemaPath: "#/properties/endpoint/maxLength", keyword: "maxLength", params: { limit: 2048 }, message: "must NOT have more than 2048 characters" };
          if (vErrors === null) {
            vErrors = [err7];
          } else {
            vErrors.push(err7);
          }
          errors++;
        }
        if (!pattern29.test(data0)) {
          const err8 = { instancePath: instancePath + "/endpoint", schemaPath: "#/properties/endpoint/pattern", keyword: "pattern", params: { pattern: "^https://(?=[^/:]*[A-Za-z])[A-Za-z0-9-]+(\\.[A-Za-z0-9-]+)+(:443)?/[\\x21-\\x7E]*$(?![\\s\\S])" }, message: 'must match pattern "^https://(?=[^/:]*[A-Za-z])[A-Za-z0-9-]+(\\.[A-Za-z0-9-]+)+(:443)?/[\\x21-\\x7E]*$(?![\\s\\S])"' };
          if (vErrors === null) {
            vErrors = [err8];
          } else {
            vErrors.push(err8);
          }
          errors++;
        }
        if (!formats0(data0)) {
          const err9 = { instancePath: instancePath + "/endpoint", schemaPath: "#/properties/endpoint/format", keyword: "format", params: { format: "uri" }, message: 'must match format "uri"' };
          if (vErrors === null) {
            vErrors = [err9];
          } else {
            vErrors.push(err9);
          }
          errors++;
        }
      } else {
        const err10 = { instancePath: instancePath + "/endpoint", schemaPath: "#/properties/endpoint/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err10];
        } else {
          vErrors.push(err10);
        }
        errors++;
      }
    }
    if (data.keys !== void 0) {
      let data1 = data.keys;
      if (data1 && typeof data1 == "object" && !Array.isArray(data1)) {
        if (data1.p256dh === void 0) {
          const err11 = { instancePath: instancePath + "/keys", schemaPath: "#/properties/keys/required", keyword: "required", params: { missingProperty: "p256dh" }, message: "must have required property 'p256dh'" };
          if (vErrors === null) {
            vErrors = [err11];
          } else {
            vErrors.push(err11);
          }
          errors++;
        }
        if (data1.auth === void 0) {
          const err12 = { instancePath: instancePath + "/keys", schemaPath: "#/properties/keys/required", keyword: "required", params: { missingProperty: "auth" }, message: "must have required property 'auth'" };
          if (vErrors === null) {
            vErrors = [err12];
          } else {
            vErrors.push(err12);
          }
          errors++;
        }
        for (const key1 in data1) {
          if (!(key1 === "p256dh" || key1 === "auth")) {
            const err13 = { instancePath: instancePath + "/keys", schemaPath: "#/properties/keys/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key1 }, message: "must NOT have additional properties" };
            if (vErrors === null) {
              vErrors = [err13];
            } else {
              vErrors.push(err13);
            }
            errors++;
          }
        }
        if (data1.p256dh !== void 0) {
          let data2 = data1.p256dh;
          if (typeof data2 === "string") {
            if (func1(data2) > 200) {
              const err14 = { instancePath: instancePath + "/keys/p256dh", schemaPath: "#/properties/keys/properties/p256dh/maxLength", keyword: "maxLength", params: { limit: 200 }, message: "must NOT have more than 200 characters" };
              if (vErrors === null) {
                vErrors = [err14];
              } else {
                vErrors.push(err14);
              }
              errors++;
            }
            if (!pattern30.test(data2)) {
              const err15 = { instancePath: instancePath + "/keys/p256dh", schemaPath: "#/properties/keys/properties/p256dh/pattern", keyword: "pattern", params: { pattern: "^[A-Za-z0-9_-]+=*$(?![\\s\\S])" }, message: 'must match pattern "^[A-Za-z0-9_-]+=*$(?![\\s\\S])"' };
              if (vErrors === null) {
                vErrors = [err15];
              } else {
                vErrors.push(err15);
              }
              errors++;
            }
          } else {
            const err16 = { instancePath: instancePath + "/keys/p256dh", schemaPath: "#/properties/keys/properties/p256dh/type", keyword: "type", params: { type: "string" }, message: "must be string" };
            if (vErrors === null) {
              vErrors = [err16];
            } else {
              vErrors.push(err16);
            }
            errors++;
          }
        }
        if (data1.auth !== void 0) {
          let data3 = data1.auth;
          if (typeof data3 === "string") {
            if (func1(data3) > 64) {
              const err17 = { instancePath: instancePath + "/keys/auth", schemaPath: "#/properties/keys/properties/auth/maxLength", keyword: "maxLength", params: { limit: 64 }, message: "must NOT have more than 64 characters" };
              if (vErrors === null) {
                vErrors = [err17];
              } else {
                vErrors.push(err17);
              }
              errors++;
            }
            if (!pattern30.test(data3)) {
              const err18 = { instancePath: instancePath + "/keys/auth", schemaPath: "#/properties/keys/properties/auth/pattern", keyword: "pattern", params: { pattern: "^[A-Za-z0-9_-]+=*$(?![\\s\\S])" }, message: 'must match pattern "^[A-Za-z0-9_-]+=*$(?![\\s\\S])"' };
              if (vErrors === null) {
                vErrors = [err18];
              } else {
                vErrors.push(err18);
              }
              errors++;
            }
          } else {
            const err19 = { instancePath: instancePath + "/keys/auth", schemaPath: "#/properties/keys/properties/auth/type", keyword: "type", params: { type: "string" }, message: "must be string" };
            if (vErrors === null) {
              vErrors = [err19];
            } else {
              vErrors.push(err19);
            }
            errors++;
          }
        }
      } else {
        const err20 = { instancePath: instancePath + "/keys", schemaPath: "#/properties/keys/type", keyword: "type", params: { type: "object" }, message: "must be object" };
        if (vErrors === null) {
          vErrors = [err20];
        } else {
          vErrors.push(err20);
        }
        errors++;
      }
    }
    if (data.topics !== void 0) {
      let data4 = data.topics;
      if (Array.isArray(data4)) {
        if (data4.length > 2) {
          const err21 = { instancePath: instancePath + "/topics", schemaPath: "#/properties/topics/maxItems", keyword: "maxItems", params: { limit: 2 }, message: "must NOT have more than 2 items" };
          if (vErrors === null) {
            vErrors = [err21];
          } else {
            vErrors.push(err21);
          }
          errors++;
        }
        if (data4.length < 1) {
          const err22 = { instancePath: instancePath + "/topics", schemaPath: "#/properties/topics/minItems", keyword: "minItems", params: { limit: 1 }, message: "must NOT have fewer than 1 items" };
          if (vErrors === null) {
            vErrors = [err22];
          } else {
            vErrors.push(err22);
          }
          errors++;
        }
        const len0 = data4.length;
        for (let i0 = 0; i0 < len0; i0++) {
          let data5 = data4[i0];
          if (!(data5 === "alerts" || data5 === "results")) {
            const err23 = { instancePath: instancePath + "/topics/" + i0, schemaPath: "#/properties/topics/items/enum", keyword: "enum", params: { allowedValues: schema69.properties.topics.items.enum }, message: "must be equal to one of the allowed values" };
            if (vErrors === null) {
              vErrors = [err23];
            } else {
              vErrors.push(err23);
            }
            errors++;
          }
        }
        let i1 = data4.length;
        let j0;
        if (i1 > 1) {
          outer0: for (; i1--; ) {
            for (j0 = i1; j0--; ) {
              if (func0(data4[i1], data4[j0])) {
                const err24 = { instancePath: instancePath + "/topics", schemaPath: "#/properties/topics/uniqueItems", keyword: "uniqueItems", params: { i: i1, j: j0 }, message: "must NOT have duplicate items (items ## " + j0 + " and " + i1 + " are identical)" };
                if (vErrors === null) {
                  vErrors = [err24];
                } else {
                  vErrors.push(err24);
                }
                errors++;
                break outer0;
              }
            }
          }
        }
      } else {
        const err25 = { instancePath: instancePath + "/topics", schemaPath: "#/properties/topics/type", keyword: "type", params: { type: "array" }, message: "must be array" };
        if (vErrors === null) {
          vErrors = [err25];
        } else {
          vErrors.push(err25);
        }
        errors++;
      }
    }
  } else {
    const err26 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err26];
    } else {
      vErrors.push(err26);
    }
    errors++;
  }
  validate57.errors = vErrors;
  return errors === 0;
}
validate57.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
exports.HealthStatus = validate99;
var schema130 = { "$id": "https://openit.example/contracts/v5/HealthStatus.schema.json", "title": "HealthStatus", "description": "3.4.4(RUNTIME R5.1, OPEN_GAPS U101 \uB2EB\uC74C): \uBAA8\uB4E0 \uC601\uC5ED \uC11C\uBE44\uC2A4\uC758 GET /healthz\xB7GET /readyz \uBCF8\uBB38\uC774 \uC9C0\uD0A4\uB294 \uACF5\uD1B5 \uCD5C\uC18C \uBAA8\uC591. \uD310\uC815\uC740 \uC0C1\uD0DC \uCF54\uB4DC\uB2E4(healthz 200 = \uC0B4\uC544 \uC788\uC74C, readyz 200 = \uC694\uCCAD\uC744 \uBC1B\uC744 \uC218 \uC788\uC74C, 503 = \uC544\uB2D8). \uBCF8\uBB38\uC740 \uBE44\uC5B4 \uC788\uC9C0 \uC54A\uC740 JSON \uAC1D\uCCB4\uC774\uACE0, status \uAC00 \uC788\uC73C\uBA74 \uC544\uB798 \uAC12 \uC911 \uD558\uB098\uB2E4. \uC601\uC5ED\uBCC4 \uC900\uBE44 \uD655\uC778 \uC2A4\uD0A4\uB9C8(SurveyReadyz\xB7GateReadyz\xB7OpsFeedbackReadyz\xB7QuestionAuthoringDeployInterface.ReadyzResponse)\uAC00 \uC788\uC73C\uBA74 \uADF8\uAC83\uB3C4 \uD568\uAED8 \uC9C0\uD0A8\uB2E4. 'not ready'(release-gate)\xB7'not-ready'(ops-feedback\xB7question-authoring)\uB294 2026-11-04 \uC774\uC804 \uD45C\uAE30\uB85C not_ready \uC640 \uAC19\uC740 \uB73B\uC774\uBA70, \uC0DD\uC0B0\uC790\uB294 not_ready \uB85C \uC62E\uAE30\uACE0 \uC77D\uB294 \uCABD\uC740 \uC14B\uC744 \uAC19\uAC8C \uB2E4\uB8EC\uB2E4(CONVENTIONS 1\uC808 3, \uD558\uC704 \uD638\uD658). \uADF8 \uBC16\uC758 \uD0A4\uB294 \uC601\uC5ED\uBCC4 \uC900\uBE44 \uD655\uC778 \uC2A4\uD0A4\uB9C8\uAC00 \uC815\uD558\uBA70 \uC774 \uACF5\uD1B5 \uC2A4\uD0A4\uB9C8\uB294 \uD5C8\uC6A9\uD55C\uB2E4(additionalProperties true).", "x-producers": ["*"], "x-consumers": ["platform", "deploy"], "type": "object", "minProperties": 1, "properties": { "status": { "enum": ["ok", "ready", "not_ready", "shutting_down", "not ready", "not-ready"] } }, "additionalProperties": true };
function validate99(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  ;
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate99.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (Object.keys(data).length < 1) {
      const err0 = { instancePath, schemaPath: "#/minProperties", keyword: "minProperties", params: { limit: 1 }, message: "must NOT have fewer than 1 properties" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.status !== void 0) {
      let data0 = data.status;
      if (!(data0 === "ok" || data0 === "ready" || data0 === "not_ready" || data0 === "shutting_down" || data0 === "not ready" || data0 === "not-ready")) {
        const err1 = { instancePath: instancePath + "/status", schemaPath: "#/properties/status/enum", keyword: "enum", params: { allowedValues: schema130.properties.status.enum }, message: "must be equal to one of the allowed values" };
        if (vErrors === null) {
          vErrors = [err1];
        } else {
          vErrors.push(err1);
        }
        errors++;
      }
    }
  } else {
    const err2 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err2];
    } else {
      vErrors.push(err2);
    }
    errors++;
  }
  validate99.errors = vErrors;
  return errors === 0;
}
validate99.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
exports.FrontendMessage = validate100;
function validate102(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate102.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (typeof data === "string") {
    if (func1(data) > 128) {
      const err0 = { instancePath, schemaPath: "#/$defs/Id/maxLength", keyword: "maxLength", params: { limit: 128 }, message: "must NOT have more than 128 characters" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (func1(data) < 1) {
      const err1 = { instancePath, schemaPath: "#/$defs/Id/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (!pattern7.test(data)) {
      const err2 = { instancePath, schemaPath: "#/$defs/Id/pattern", keyword: "pattern", params: { pattern: "^[A-Za-z0-9][A-Za-z0-9._:-]*$(?![\\s\\S])" }, message: 'must match pattern "^[A-Za-z0-9][A-Za-z0-9._:-]*$(?![\\s\\S])"' };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
  } else {
    const err3 = { instancePath, schemaPath: "#/$defs/Id/type", keyword: "type", params: { type: "string" }, message: "must be string" };
    if (vErrors === null) {
      vErrors = [err3];
    } else {
      vErrors.push(err3);
    }
    errors++;
  }
  if (typeof data === "string") {
    if (func1(data) > 64) {
      const err4 = { instancePath, schemaPath: "#/maxLength", keyword: "maxLength", params: { limit: 64 }, message: "must NOT have more than 64 characters" };
      if (vErrors === null) {
        vErrors = [err4];
      } else {
        vErrors.push(err4);
      }
      errors++;
    }
    if (!pattern8.test(data)) {
      const err5 = { instancePath, schemaPath: "#/pattern", keyword: "pattern", params: { pattern: "^[A-Za-z0-9_-]*$(?![\\s\\S])" }, message: 'must match pattern "^[A-Za-z0-9_-]*$(?![\\s\\S])"' };
      if (vErrors === null) {
        vErrors = [err5];
      } else {
        vErrors.push(err5);
      }
      errors++;
    }
  }
  validate102.errors = vErrors;
  return errors === 0;
}
validate102.evaluated = { "dynamicProps": false, "dynamicItems": false };
function validate101(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate101.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  const _errs0 = errors;
  let valid0 = false;
  let passing0 = null;
  const _errs1 = errors;
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.kind === void 0) {
      const err0 = { instancePath, schemaPath: "#/oneOf/0/required", keyword: "required", params: { missingProperty: "kind" }, message: "must have required property 'kind'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    for (const key0 in data) {
      if (!(key0 === "session_id" || key0 === "kind" || key0 === "subject_ref" || key0 === "question_set_id")) {
        const err1 = { instancePath, schemaPath: "#/oneOf/0/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
        if (vErrors === null) {
          vErrors = [err1];
        } else {
          vErrors.push(err1);
        }
        errors++;
      }
    }
    if (data.session_id !== void 0) {
      if (!validate102(data.session_id, { instancePath: instancePath + "/session_id", parentData: data, parentDataProperty: "session_id", rootData, dynamicAnchors })) {
        vErrors = vErrors === null ? validate102.errors : vErrors.concat(validate102.errors);
        errors = vErrors.length;
      }
    }
    if (data.kind !== void 0) {
      if ("SESSION_START" !== data.kind) {
        const err2 = { instancePath: instancePath + "/kind", schemaPath: "#/oneOf/0/properties/kind/const", keyword: "const", params: { allowedValue: "SESSION_START" }, message: "must be equal to constant" };
        if (vErrors === null) {
          vErrors = [err2];
        } else {
          vErrors.push(err2);
        }
        errors++;
      }
    }
    if (data.subject_ref !== void 0) {
      let data2 = data.subject_ref;
      if (typeof data2 === "string") {
        if (!pattern16.test(data2)) {
          const err3 = { instancePath: instancePath + "/subject_ref", schemaPath: "https://openit.example/contracts/v5/PublicApiRequests.schema.json#/$defs/SessionStartBody/properties/subject_ref/pattern", keyword: "pattern", params: { pattern: "^[A-Za-z0-9._:/#=+-]{1,128}$(?![\\s\\S])" }, message: 'must match pattern "^[A-Za-z0-9._:/#=+-]{1,128}$(?![\\s\\S])"' };
          if (vErrors === null) {
            vErrors = [err3];
          } else {
            vErrors.push(err3);
          }
          errors++;
        }
      } else {
        const err4 = { instancePath: instancePath + "/subject_ref", schemaPath: "https://openit.example/contracts/v5/PublicApiRequests.schema.json#/$defs/SessionStartBody/properties/subject_ref/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err4];
        } else {
          vErrors.push(err4);
        }
        errors++;
      }
    }
    if (data.question_set_id !== void 0) {
      let data3 = data.question_set_id;
      if (typeof data3 === "string") {
        if (func1(data3) > 128) {
          const err5 = { instancePath: instancePath + "/question_set_id", schemaPath: "https://openit.example/contracts/v5/_common.schema.json#/$defs/Id/maxLength", keyword: "maxLength", params: { limit: 128 }, message: "must NOT have more than 128 characters" };
          if (vErrors === null) {
            vErrors = [err5];
          } else {
            vErrors.push(err5);
          }
          errors++;
        }
        if (func1(data3) < 1) {
          const err6 = { instancePath: instancePath + "/question_set_id", schemaPath: "https://openit.example/contracts/v5/_common.schema.json#/$defs/Id/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" };
          if (vErrors === null) {
            vErrors = [err6];
          } else {
            vErrors.push(err6);
          }
          errors++;
        }
        if (!pattern7.test(data3)) {
          const err7 = { instancePath: instancePath + "/question_set_id", schemaPath: "https://openit.example/contracts/v5/_common.schema.json#/$defs/Id/pattern", keyword: "pattern", params: { pattern: "^[A-Za-z0-9][A-Za-z0-9._:-]*$(?![\\s\\S])" }, message: 'must match pattern "^[A-Za-z0-9][A-Za-z0-9._:-]*$(?![\\s\\S])"' };
          if (vErrors === null) {
            vErrors = [err7];
          } else {
            vErrors.push(err7);
          }
          errors++;
        }
      } else {
        const err8 = { instancePath: instancePath + "/question_set_id", schemaPath: "https://openit.example/contracts/v5/_common.schema.json#/$defs/Id/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err8];
        } else {
          vErrors.push(err8);
        }
        errors++;
      }
    }
  } else {
    const err9 = { instancePath, schemaPath: "#/oneOf/0/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err9];
    } else {
      vErrors.push(err9);
    }
    errors++;
  }
  var _valid0 = _errs1 === errors;
  if (_valid0) {
    valid0 = true;
    passing0 = 0;
    var props0 = true;
  }
  const _errs12 = errors;
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.session_id === void 0) {
      const err10 = { instancePath, schemaPath: "#/oneOf/1/required", keyword: "required", params: { missingProperty: "session_id" }, message: "must have required property 'session_id'" };
      if (vErrors === null) {
        vErrors = [err10];
      } else {
        vErrors.push(err10);
      }
      errors++;
    }
    if (data.kind === void 0) {
      const err11 = { instancePath, schemaPath: "#/oneOf/1/required", keyword: "required", params: { missingProperty: "kind" }, message: "must have required property 'kind'" };
      if (vErrors === null) {
        vErrors = [err11];
      } else {
        vErrors.push(err11);
      }
      errors++;
    }
    if (data.utterance === void 0) {
      const err12 = { instancePath, schemaPath: "#/oneOf/1/required", keyword: "required", params: { missingProperty: "utterance" }, message: "must have required property 'utterance'" };
      if (vErrors === null) {
        vErrors = [err12];
      } else {
        vErrors.push(err12);
      }
      errors++;
    }
    for (const key1 in data) {
      if (!(key1 === "session_id" || key1 === "kind" || key1 === "utterance")) {
        const err13 = { instancePath, schemaPath: "#/oneOf/1/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key1 }, message: "must NOT have additional properties" };
        if (vErrors === null) {
          vErrors = [err13];
        } else {
          vErrors.push(err13);
        }
        errors++;
      }
    }
    if (data.session_id !== void 0) {
      if (!validate102(data.session_id, { instancePath: instancePath + "/session_id", parentData: data, parentDataProperty: "session_id", rootData, dynamicAnchors })) {
        vErrors = vErrors === null ? validate102.errors : vErrors.concat(validate102.errors);
        errors = vErrors.length;
      }
    }
    if (data.kind !== void 0) {
      if ("UTTERANCE" !== data.kind) {
        const err14 = { instancePath: instancePath + "/kind", schemaPath: "#/oneOf/1/properties/kind/const", keyword: "const", params: { allowedValue: "UTTERANCE" }, message: "must be equal to constant" };
        if (vErrors === null) {
          vErrors = [err14];
        } else {
          vErrors.push(err14);
        }
        errors++;
      }
    }
    if (data.utterance !== void 0) {
      if (typeof data.utterance !== "string") {
        const err15 = { instancePath: instancePath + "/utterance", schemaPath: "#/oneOf/1/properties/utterance/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err15];
        } else {
          vErrors.push(err15);
        }
        errors++;
      }
    }
  } else {
    const err16 = { instancePath, schemaPath: "#/oneOf/1/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err16];
    } else {
      vErrors.push(err16);
    }
    errors++;
  }
  var _valid0 = _errs12 === errors;
  if (_valid0 && valid0) {
    valid0 = false;
    passing0 = [passing0, 1];
  } else {
    if (_valid0) {
      valid0 = true;
      passing0 = 1;
      if (props0 !== true) {
        props0 = true;
      }
    }
    const _errs19 = errors;
    if (data && typeof data == "object" && !Array.isArray(data)) {
      if (data.session_id === void 0) {
        const err17 = { instancePath, schemaPath: "#/oneOf/2/required", keyword: "required", params: { missingProperty: "session_id" }, message: "must have required property 'session_id'" };
        if (vErrors === null) {
          vErrors = [err17];
        } else {
          vErrors.push(err17);
        }
        errors++;
      }
      if (data.kind === void 0) {
        const err18 = { instancePath, schemaPath: "#/oneOf/2/required", keyword: "required", params: { missingProperty: "kind" }, message: "must have required property 'kind'" };
        if (vErrors === null) {
          vErrors = [err18];
        } else {
          vErrors.push(err18);
        }
        errors++;
      }
      for (const key2 in data) {
        if (!(key2 === "session_id" || key2 === "kind")) {
          const err19 = { instancePath, schemaPath: "#/oneOf/2/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key2 }, message: "must NOT have additional properties" };
          if (vErrors === null) {
            vErrors = [err19];
          } else {
            vErrors.push(err19);
          }
          errors++;
        }
      }
      if (data.session_id !== void 0) {
        if (!validate102(data.session_id, { instancePath: instancePath + "/session_id", parentData: data, parentDataProperty: "session_id", rootData, dynamicAnchors })) {
          vErrors = vErrors === null ? validate102.errors : vErrors.concat(validate102.errors);
          errors = vErrors.length;
        }
      }
      if (data.kind !== void 0) {
        if ("SESSION_END" !== data.kind) {
          const err20 = { instancePath: instancePath + "/kind", schemaPath: "#/oneOf/2/properties/kind/const", keyword: "const", params: { allowedValue: "SESSION_END" }, message: "must be equal to constant" };
          if (vErrors === null) {
            vErrors = [err20];
          } else {
            vErrors.push(err20);
          }
          errors++;
        }
      }
    } else {
      const err21 = { instancePath, schemaPath: "#/oneOf/2/type", keyword: "type", params: { type: "object" }, message: "must be object" };
      if (vErrors === null) {
        vErrors = [err21];
      } else {
        vErrors.push(err21);
      }
      errors++;
    }
    var _valid0 = _errs19 === errors;
    if (_valid0 && valid0) {
      valid0 = false;
      passing0 = [passing0, 2];
    } else {
      if (_valid0) {
        valid0 = true;
        passing0 = 2;
        if (props0 !== true) {
          props0 = true;
        }
      }
    }
  }
  if (!valid0) {
    const err22 = { instancePath, schemaPath: "#/oneOf", keyword: "oneOf", params: { passingSchemas: passing0 }, message: "must match exactly one schema in oneOf" };
    if (vErrors === null) {
      vErrors = [err22];
    } else {
      vErrors.push(err22);
    }
    errors++;
  } else {
    errors = _errs0;
    if (vErrors !== null) {
      if (_errs0) {
        vErrors.length = _errs0;
      } else {
        vErrors = null;
      }
    }
  }
  validate101.errors = vErrors;
  evaluated0.props = props0;
  return errors === 0;
}
validate101.evaluated = { "dynamicProps": true, "dynamicItems": false };
function validate100(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  ;
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate100.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (!validate101(data, { instancePath, parentData, parentDataProperty, rootData, dynamicAnchors })) {
    vErrors = vErrors === null ? validate101.errors : vErrors.concat(validate101.errors);
    errors = vErrors.length;
  } else {
    var props0 = validate101.evaluated.props;
  }
  validate100.errors = vErrors;
  evaluated0.props = props0;
  return errors === 0;
}
validate100.evaluated = { "dynamicProps": true, "dynamicItems": false };
exports.InterventionDecision = validate107;
function validate109(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate109.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (typeof data === "string") {
    if (func1(data) > 128) {
      const err0 = { instancePath, schemaPath: "#/$defs/Id/maxLength", keyword: "maxLength", params: { limit: 128 }, message: "must NOT have more than 128 characters" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (func1(data) < 1) {
      const err1 = { instancePath, schemaPath: "#/$defs/Id/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (!pattern7.test(data)) {
      const err2 = { instancePath, schemaPath: "#/$defs/Id/pattern", keyword: "pattern", params: { pattern: "^[A-Za-z0-9][A-Za-z0-9._:-]*$(?![\\s\\S])" }, message: 'must match pattern "^[A-Za-z0-9][A-Za-z0-9._:-]*$(?![\\s\\S])"' };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
  } else {
    const err3 = { instancePath, schemaPath: "#/$defs/Id/type", keyword: "type", params: { type: "string" }, message: "must be string" };
    if (vErrors === null) {
      vErrors = [err3];
    } else {
      vErrors.push(err3);
    }
    errors++;
  }
  if (typeof data === "string") {
    if (func1(data) > 64) {
      const err4 = { instancePath, schemaPath: "#/maxLength", keyword: "maxLength", params: { limit: 64 }, message: "must NOT have more than 64 characters" };
      if (vErrors === null) {
        vErrors = [err4];
      } else {
        vErrors.push(err4);
      }
      errors++;
    }
    if (!pattern8.test(data)) {
      const err5 = { instancePath, schemaPath: "#/pattern", keyword: "pattern", params: { pattern: "^[A-Za-z0-9_-]*$(?![\\s\\S])" }, message: 'must match pattern "^[A-Za-z0-9_-]*$(?![\\s\\S])"' };
      if (vErrors === null) {
        vErrors = [err5];
      } else {
        vErrors.push(err5);
      }
      errors++;
    }
  }
  validate109.errors = vErrors;
  return errors === 0;
}
validate109.evaluated = { "dynamicProps": false, "dynamicItems": false };
function validate108(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate108.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.session_id === void 0) {
      const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "session_id" }, message: "must have required property 'session_id'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.decision === void 0) {
      const err1 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "decision" }, message: "must have required property 'decision'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    for (const key0 in data) {
      if (!(key0 === "session_id" || key0 === "decision")) {
        const err2 = { instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
        if (vErrors === null) {
          vErrors = [err2];
        } else {
          vErrors.push(err2);
        }
        errors++;
      }
    }
    if (data.session_id !== void 0) {
      if (!validate109(data.session_id, { instancePath: instancePath + "/session_id", parentData: data, parentDataProperty: "session_id", rootData, dynamicAnchors })) {
        vErrors = vErrors === null ? validate109.errors : vErrors.concat(validate109.errors);
        errors = vErrors.length;
      }
    }
    if (data.decision !== void 0) {
      let data1 = data.decision;
      const _errs5 = errors;
      let valid2 = false;
      let passing0 = null;
      const _errs6 = errors;
      if ("RESUME" !== data1) {
        const err3 = { instancePath: instancePath + "/decision", schemaPath: "#/$defs/Decision/oneOf/0/const", keyword: "const", params: { allowedValue: "RESUME" }, message: "must be equal to constant" };
        if (vErrors === null) {
          vErrors = [err3];
        } else {
          vErrors.push(err3);
        }
        errors++;
      }
      var _valid0 = _errs6 === errors;
      if (_valid0) {
        valid2 = true;
        passing0 = 0;
      }
      const _errs7 = errors;
      if ("END" !== data1) {
        const err4 = { instancePath: instancePath + "/decision", schemaPath: "#/$defs/Decision/oneOf/1/const", keyword: "const", params: { allowedValue: "END" }, message: "must be equal to constant" };
        if (vErrors === null) {
          vErrors = [err4];
        } else {
          vErrors.push(err4);
        }
        errors++;
      }
      var _valid0 = _errs7 === errors;
      if (_valid0 && valid2) {
        valid2 = false;
        passing0 = [passing0, 1];
      } else {
        if (_valid0) {
          valid2 = true;
          passing0 = 1;
        }
      }
      if (!valid2) {
        const err5 = { instancePath: instancePath + "/decision", schemaPath: "#/$defs/Decision/oneOf", keyword: "oneOf", params: { passingSchemas: passing0 }, message: "must match exactly one schema in oneOf" };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      } else {
        errors = _errs5;
        if (vErrors !== null) {
          if (_errs5) {
            vErrors.length = _errs5;
          } else {
            vErrors = null;
          }
        }
      }
    }
  } else {
    const err6 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err6];
    } else {
      vErrors.push(err6);
    }
    errors++;
  }
  validate108.errors = vErrors;
  return errors === 0;
}
validate108.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
function validate107(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  ;
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate107.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (!validate108(data, { instancePath, parentData, parentDataProperty, rootData, dynamicAnchors })) {
    vErrors = vErrors === null ? validate108.errors : vErrors.concat(validate108.errors);
    errors = vErrors.length;
  }
  validate107.errors = vErrors;
  return errors === 0;
}
validate107.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };

exports.PIPELINE_SCHEMA_VERSION = "5.0";
