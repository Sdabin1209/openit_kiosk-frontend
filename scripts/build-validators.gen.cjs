// 생성 파일: node scripts/gen-validators.mjs (직접 고치지 않는다). 출처: boundary-contracts BuildImageRequest, BuildImageResult, SetupEnvReport, Exposure, ContainerInputs (패키지 버전 3.6.3).
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
exports.BuildImageRequest = validate20;
var func1 = require_ucs2length().default;
var pattern4 = new RegExp("^/", "u");
var pattern5 = new RegExp("^[0-9a-f]{7,40}$", "u");
var pattern6 = new RegExp("^v[0-9]+\\.[0-9]+\\.[0-9]+$", "u");
var pattern12 = new RegExp("^[a-z0-9-]+$", "u");
var pattern13 = new RegExp("^[a-z0-9./_-]+:[A-Za-z0-9._-]+$", "u");
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
    if (data.source_dir === void 0) {
      const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "source_dir" }, message: "must have required property 'source_dir'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.revision === void 0) {
      const err1 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "revision" }, message: "must have required property 'revision'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.versions === void 0) {
      const err2 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "versions" }, message: "must have required property 'versions'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.image_tag === void 0) {
      const err3 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "image_tag" }, message: "must have required property 'image_tag'" };
      if (vErrors === null) {
        vErrors = [err3];
      } else {
        vErrors.push(err3);
      }
      errors++;
    }
    for (const key0 in data) {
      if (!(key0 === "source_dir" || key0 === "revision" || key0 === "versions" || key0 === "dependency_sources" || key0 === "variant" || key0 === "image_tag")) {
        const err4 = { instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
        if (vErrors === null) {
          vErrors = [err4];
        } else {
          vErrors.push(err4);
        }
        errors++;
      }
    }
    if (data.source_dir !== void 0) {
      let data0 = data.source_dir;
      if (typeof data0 === "string") {
        if (func1(data0) < 1) {
          const err5 = { instancePath: instancePath + "/source_dir", schemaPath: "#/properties/source_dir/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" };
          if (vErrors === null) {
            vErrors = [err5];
          } else {
            vErrors.push(err5);
          }
          errors++;
        }
        if (!pattern4.test(data0)) {
          const err6 = { instancePath: instancePath + "/source_dir", schemaPath: "#/properties/source_dir/pattern", keyword: "pattern", params: { pattern: "^/" }, message: 'must match pattern "^/"' };
          if (vErrors === null) {
            vErrors = [err6];
          } else {
            vErrors.push(err6);
          }
          errors++;
        }
      } else {
        const err7 = { instancePath: instancePath + "/source_dir", schemaPath: "#/properties/source_dir/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
    }
    if (data.revision !== void 0) {
      let data1 = data.revision;
      if (typeof data1 === "string") {
        if (!pattern5.test(data1)) {
          const err8 = { instancePath: instancePath + "/revision", schemaPath: "#/properties/revision/pattern", keyword: "pattern", params: { pattern: "^[0-9a-f]{7,40}$" }, message: 'must match pattern "^[0-9a-f]{7,40}$"' };
          if (vErrors === null) {
            vErrors = [err8];
          } else {
            vErrors.push(err8);
          }
          errors++;
        }
      } else {
        const err9 = { instancePath: instancePath + "/revision", schemaPath: "#/properties/revision/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err9];
        } else {
          vErrors.push(err9);
        }
        errors++;
      }
    }
    if (data.versions !== void 0) {
      let data2 = data.versions;
      if (data2 && typeof data2 == "object" && !Array.isArray(data2)) {
        if (data2.boundary === void 0) {
          const err10 = { instancePath: instancePath + "/versions", schemaPath: "#/properties/versions/required", keyword: "required", params: { missingProperty: "boundary" }, message: "must have required property 'boundary'" };
          if (vErrors === null) {
            vErrors = [err10];
          } else {
            vErrors.push(err10);
          }
          errors++;
        }
        for (const key1 in data2) {
          if (!(key1 === "boundary" || key1 === "model_runtime" || key1 === "survey_schema")) {
            const err11 = { instancePath: instancePath + "/versions", schemaPath: "#/properties/versions/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key1 }, message: "must NOT have additional properties" };
            if (vErrors === null) {
              vErrors = [err11];
            } else {
              vErrors.push(err11);
            }
            errors++;
          }
        }
        if (data2.boundary !== void 0) {
          let data3 = data2.boundary;
          if (typeof data3 === "string") {
            if (!pattern6.test(data3)) {
              const err12 = { instancePath: instancePath + "/versions/boundary", schemaPath: "#/properties/versions/properties/boundary/pattern", keyword: "pattern", params: { pattern: "^v[0-9]+\\.[0-9]+\\.[0-9]+$" }, message: 'must match pattern "^v[0-9]+\\.[0-9]+\\.[0-9]+$"' };
              if (vErrors === null) {
                vErrors = [err12];
              } else {
                vErrors.push(err12);
              }
              errors++;
            }
          } else {
            const err13 = { instancePath: instancePath + "/versions/boundary", schemaPath: "#/properties/versions/properties/boundary/type", keyword: "type", params: { type: "string" }, message: "must be string" };
            if (vErrors === null) {
              vErrors = [err13];
            } else {
              vErrors.push(err13);
            }
            errors++;
          }
        }
        if (data2.model_runtime !== void 0) {
          let data4 = data2.model_runtime;
          if (typeof data4 === "string") {
            if (!pattern6.test(data4)) {
              const err14 = { instancePath: instancePath + "/versions/model_runtime", schemaPath: "#/properties/versions/properties/model_runtime/pattern", keyword: "pattern", params: { pattern: "^v[0-9]+\\.[0-9]+\\.[0-9]+$" }, message: 'must match pattern "^v[0-9]+\\.[0-9]+\\.[0-9]+$"' };
              if (vErrors === null) {
                vErrors = [err14];
              } else {
                vErrors.push(err14);
              }
              errors++;
            }
          } else {
            const err15 = { instancePath: instancePath + "/versions/model_runtime", schemaPath: "#/properties/versions/properties/model_runtime/type", keyword: "type", params: { type: "string" }, message: "must be string" };
            if (vErrors === null) {
              vErrors = [err15];
            } else {
              vErrors.push(err15);
            }
            errors++;
          }
        }
        if (data2.survey_schema !== void 0) {
          let data5 = data2.survey_schema;
          if (typeof data5 === "string") {
            if (!pattern6.test(data5)) {
              const err16 = { instancePath: instancePath + "/versions/survey_schema", schemaPath: "#/properties/versions/properties/survey_schema/pattern", keyword: "pattern", params: { pattern: "^v[0-9]+\\.[0-9]+\\.[0-9]+$" }, message: 'must match pattern "^v[0-9]+\\.[0-9]+\\.[0-9]+$"' };
              if (vErrors === null) {
                vErrors = [err16];
              } else {
                vErrors.push(err16);
              }
              errors++;
            }
          } else {
            const err17 = { instancePath: instancePath + "/versions/survey_schema", schemaPath: "#/properties/versions/properties/survey_schema/type", keyword: "type", params: { type: "string" }, message: "must be string" };
            if (vErrors === null) {
              vErrors = [err17];
            } else {
              vErrors.push(err17);
            }
            errors++;
          }
        }
      } else {
        const err18 = { instancePath: instancePath + "/versions", schemaPath: "#/properties/versions/type", keyword: "type", params: { type: "object" }, message: "must be object" };
        if (vErrors === null) {
          vErrors = [err18];
        } else {
          vErrors.push(err18);
        }
        errors++;
      }
    }
    if (data.dependency_sources !== void 0) {
      let data6 = data.dependency_sources;
      if (data6 && typeof data6 == "object" && !Array.isArray(data6)) {
        for (const key2 in data6) {
          if (!(key2 === "boundary" || key2 === "model_runtime" || key2 === "survey_schema")) {
            const err19 = { instancePath: instancePath + "/dependency_sources", schemaPath: "#/properties/dependency_sources/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key2 }, message: "must NOT have additional properties" };
            if (vErrors === null) {
              vErrors = [err19];
            } else {
              vErrors.push(err19);
            }
            errors++;
          }
        }
        if (data6.boundary !== void 0) {
          let data7 = data6.boundary;
          if (typeof data7 === "string") {
            if (func1(data7) < 1) {
              const err20 = { instancePath: instancePath + "/dependency_sources/boundary", schemaPath: "#/properties/dependency_sources/properties/boundary/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" };
              if (vErrors === null) {
                vErrors = [err20];
              } else {
                vErrors.push(err20);
              }
              errors++;
            }
            if (!pattern4.test(data7)) {
              const err21 = { instancePath: instancePath + "/dependency_sources/boundary", schemaPath: "#/properties/dependency_sources/properties/boundary/pattern", keyword: "pattern", params: { pattern: "^/" }, message: 'must match pattern "^/"' };
              if (vErrors === null) {
                vErrors = [err21];
              } else {
                vErrors.push(err21);
              }
              errors++;
            }
          } else {
            const err22 = { instancePath: instancePath + "/dependency_sources/boundary", schemaPath: "#/properties/dependency_sources/properties/boundary/type", keyword: "type", params: { type: "string" }, message: "must be string" };
            if (vErrors === null) {
              vErrors = [err22];
            } else {
              vErrors.push(err22);
            }
            errors++;
          }
        }
        if (data6.model_runtime !== void 0) {
          let data8 = data6.model_runtime;
          if (typeof data8 === "string") {
            if (func1(data8) < 1) {
              const err23 = { instancePath: instancePath + "/dependency_sources/model_runtime", schemaPath: "#/properties/dependency_sources/properties/model_runtime/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" };
              if (vErrors === null) {
                vErrors = [err23];
              } else {
                vErrors.push(err23);
              }
              errors++;
            }
            if (!pattern4.test(data8)) {
              const err24 = { instancePath: instancePath + "/dependency_sources/model_runtime", schemaPath: "#/properties/dependency_sources/properties/model_runtime/pattern", keyword: "pattern", params: { pattern: "^/" }, message: 'must match pattern "^/"' };
              if (vErrors === null) {
                vErrors = [err24];
              } else {
                vErrors.push(err24);
              }
              errors++;
            }
          } else {
            const err25 = { instancePath: instancePath + "/dependency_sources/model_runtime", schemaPath: "#/properties/dependency_sources/properties/model_runtime/type", keyword: "type", params: { type: "string" }, message: "must be string" };
            if (vErrors === null) {
              vErrors = [err25];
            } else {
              vErrors.push(err25);
            }
            errors++;
          }
        }
        if (data6.survey_schema !== void 0) {
          let data9 = data6.survey_schema;
          if (typeof data9 === "string") {
            if (func1(data9) < 1) {
              const err26 = { instancePath: instancePath + "/dependency_sources/survey_schema", schemaPath: "#/properties/dependency_sources/properties/survey_schema/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" };
              if (vErrors === null) {
                vErrors = [err26];
              } else {
                vErrors.push(err26);
              }
              errors++;
            }
            if (!pattern4.test(data9)) {
              const err27 = { instancePath: instancePath + "/dependency_sources/survey_schema", schemaPath: "#/properties/dependency_sources/properties/survey_schema/pattern", keyword: "pattern", params: { pattern: "^/" }, message: 'must match pattern "^/"' };
              if (vErrors === null) {
                vErrors = [err27];
              } else {
                vErrors.push(err27);
              }
              errors++;
            }
          } else {
            const err28 = { instancePath: instancePath + "/dependency_sources/survey_schema", schemaPath: "#/properties/dependency_sources/properties/survey_schema/type", keyword: "type", params: { type: "string" }, message: "must be string" };
            if (vErrors === null) {
              vErrors = [err28];
            } else {
              vErrors.push(err28);
            }
            errors++;
          }
        }
      } else {
        const err29 = { instancePath: instancePath + "/dependency_sources", schemaPath: "#/properties/dependency_sources/type", keyword: "type", params: { type: "object" }, message: "must be object" };
        if (vErrors === null) {
          vErrors = [err29];
        } else {
          vErrors.push(err29);
        }
        errors++;
      }
    }
    if (data.variant !== void 0) {
      let data10 = data.variant;
      if (typeof data10 === "string") {
        if (!pattern12.test(data10)) {
          const err30 = { instancePath: instancePath + "/variant", schemaPath: "#/properties/variant/pattern", keyword: "pattern", params: { pattern: "^[a-z0-9-]+$" }, message: 'must match pattern "^[a-z0-9-]+$"' };
          if (vErrors === null) {
            vErrors = [err30];
          } else {
            vErrors.push(err30);
          }
          errors++;
        }
      } else {
        const err31 = { instancePath: instancePath + "/variant", schemaPath: "#/properties/variant/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err31];
        } else {
          vErrors.push(err31);
        }
        errors++;
      }
    }
    if (data.image_tag !== void 0) {
      let data11 = data.image_tag;
      if (typeof data11 === "string") {
        if (!pattern13.test(data11)) {
          const err32 = { instancePath: instancePath + "/image_tag", schemaPath: "#/properties/image_tag/pattern", keyword: "pattern", params: { pattern: "^[a-z0-9./_-]+:[A-Za-z0-9._-]+$" }, message: 'must match pattern "^[a-z0-9./_-]+:[A-Za-z0-9._-]+$"' };
          if (vErrors === null) {
            vErrors = [err32];
          } else {
            vErrors.push(err32);
          }
          errors++;
        }
      } else {
        const err33 = { instancePath: instancePath + "/image_tag", schemaPath: "#/properties/image_tag/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err33];
        } else {
          vErrors.push(err33);
        }
        errors++;
      }
    }
  } else {
    const err34 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err34];
    } else {
      vErrors.push(err34);
    }
    errors++;
  }
  validate20.errors = vErrors;
  return errors === 0;
}
validate20.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
exports.BuildImageResult = validate21;
var pattern15 = new RegExp("^sha256:[0-9a-f]{64}$", "u");
var pattern16 = new RegExp("^io\\.openit\\.(?!(service|revision|contracts\\.boundary|contracts\\.survey-schema|model-runtime|variant|app-version|langgraph|jobs|exposure|database|inputs)$)", "u");
var pattern17 = new RegExp("^[a-z][a-z0-9-]*$", "u");
var pattern20 = new RegExp("^([0-9]+|n/a)$", "u");
var pattern21 = new RegExp("^(v[0-9]+\\.[0-9]+\\.[0-9]+|n/a)$", "u");
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
    if (data["io.openit.service"] === void 0) {
      const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "io.openit.service" }, message: "must have required property 'io.openit.service'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data["io.openit.revision"] === void 0) {
      const err1 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "io.openit.revision" }, message: "must have required property 'io.openit.revision'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data["io.openit.contracts.boundary"] === void 0) {
      const err2 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "io.openit.contracts.boundary" }, message: "must have required property 'io.openit.contracts.boundary'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data["io.openit.contracts.survey-schema"] === void 0) {
      const err3 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "io.openit.contracts.survey-schema" }, message: "must have required property 'io.openit.contracts.survey-schema'" };
      if (vErrors === null) {
        vErrors = [err3];
      } else {
        vErrors.push(err3);
      }
      errors++;
    }
    if (data["io.openit.inputs"] === void 0) {
      const err4 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "io.openit.inputs" }, message: "must have required property 'io.openit.inputs'" };
      if (vErrors === null) {
        vErrors = [err4];
      } else {
        vErrors.push(err4);
      }
      errors++;
    }
    for (const key0 in data) {
      const _errs1 = errors;
      const _errs2 = errors;
      const _errs3 = errors;
      if (typeof key0 === "string") {
        if (!pattern16.test(key0)) {
          const err5 = {};
          if (vErrors === null) {
            vErrors = [err5];
          } else {
            vErrors.push(err5);
          }
          errors++;
        }
      }
      var valid1 = _errs3 === errors;
      if (valid1) {
        const err6 = { instancePath, schemaPath: "#/propertyNames/not", keyword: "not", params: {}, message: "must NOT be valid", propertyName: key0 };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      } else {
        errors = _errs2;
        if (vErrors !== null) {
          if (_errs2) {
            vErrors.length = _errs2;
          } else {
            vErrors = null;
          }
        }
      }
      var valid0 = _errs1 === errors;
      if (!valid0) {
        const err7 = { instancePath, schemaPath: "#/propertyNames", keyword: "propertyNames", params: { propertyName: key0 }, message: "property name must be valid" };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
    }
    if (data["io.openit.service"] !== void 0) {
      let data0 = data["io.openit.service"];
      if (typeof data0 === "string") {
        if (!pattern17.test(data0)) {
          const err8 = { instancePath: instancePath + "/io.openit.service", schemaPath: "#/properties/io.openit.service/pattern", keyword: "pattern", params: { pattern: "^[a-z][a-z0-9-]*$" }, message: 'must match pattern "^[a-z][a-z0-9-]*$"' };
          if (vErrors === null) {
            vErrors = [err8];
          } else {
            vErrors.push(err8);
          }
          errors++;
        }
      } else {
        const err9 = { instancePath: instancePath + "/io.openit.service", schemaPath: "#/properties/io.openit.service/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err9];
        } else {
          vErrors.push(err9);
        }
        errors++;
      }
    }
    if (data["io.openit.revision"] !== void 0) {
      let data1 = data["io.openit.revision"];
      if (typeof data1 === "string") {
        if (!pattern5.test(data1)) {
          const err10 = { instancePath: instancePath + "/io.openit.revision", schemaPath: "#/properties/io.openit.revision/pattern", keyword: "pattern", params: { pattern: "^[0-9a-f]{7,40}$" }, message: 'must match pattern "^[0-9a-f]{7,40}$"' };
          if (vErrors === null) {
            vErrors = [err10];
          } else {
            vErrors.push(err10);
          }
          errors++;
        }
      } else {
        const err11 = { instancePath: instancePath + "/io.openit.revision", schemaPath: "#/properties/io.openit.revision/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err11];
        } else {
          vErrors.push(err11);
        }
        errors++;
      }
    }
    if (data["io.openit.contracts.boundary"] !== void 0) {
      let data2 = data["io.openit.contracts.boundary"];
      if (typeof data2 === "string") {
        if (!pattern6.test(data2)) {
          const err12 = { instancePath: instancePath + "/io.openit.contracts.boundary", schemaPath: "#/properties/io.openit.contracts.boundary/pattern", keyword: "pattern", params: { pattern: "^v[0-9]+\\.[0-9]+\\.[0-9]+$" }, message: 'must match pattern "^v[0-9]+\\.[0-9]+\\.[0-9]+$"' };
          if (vErrors === null) {
            vErrors = [err12];
          } else {
            vErrors.push(err12);
          }
          errors++;
        }
      } else {
        const err13 = { instancePath: instancePath + "/io.openit.contracts.boundary", schemaPath: "#/properties/io.openit.contracts.boundary/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err13];
        } else {
          vErrors.push(err13);
        }
        errors++;
      }
    }
    if (data["io.openit.contracts.survey-schema"] !== void 0) {
      let data3 = data["io.openit.contracts.survey-schema"];
      if (typeof data3 === "string") {
        if (!pattern20.test(data3)) {
          const err14 = { instancePath: instancePath + "/io.openit.contracts.survey-schema", schemaPath: "#/properties/io.openit.contracts.survey-schema/pattern", keyword: "pattern", params: { pattern: "^([0-9]+|n/a)$" }, message: 'must match pattern "^([0-9]+|n/a)$"' };
          if (vErrors === null) {
            vErrors = [err14];
          } else {
            vErrors.push(err14);
          }
          errors++;
        }
      } else {
        const err15 = { instancePath: instancePath + "/io.openit.contracts.survey-schema", schemaPath: "#/properties/io.openit.contracts.survey-schema/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err15];
        } else {
          vErrors.push(err15);
        }
        errors++;
      }
    }
    if (data["io.openit.model-runtime"] !== void 0) {
      let data4 = data["io.openit.model-runtime"];
      if (typeof data4 === "string") {
        if (!pattern21.test(data4)) {
          const err16 = { instancePath: instancePath + "/io.openit.model-runtime", schemaPath: "#/properties/io.openit.model-runtime/pattern", keyword: "pattern", params: { pattern: "^(v[0-9]+\\.[0-9]+\\.[0-9]+|n/a)$" }, message: 'must match pattern "^(v[0-9]+\\.[0-9]+\\.[0-9]+|n/a)$"' };
          if (vErrors === null) {
            vErrors = [err16];
          } else {
            vErrors.push(err16);
          }
          errors++;
        }
      } else {
        const err17 = { instancePath: instancePath + "/io.openit.model-runtime", schemaPath: "#/properties/io.openit.model-runtime/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err17];
        } else {
          vErrors.push(err17);
        }
        errors++;
      }
    }
    if (data["io.openit.variant"] !== void 0) {
      let data5 = data["io.openit.variant"];
      if (typeof data5 === "string") {
        if (!pattern17.test(data5)) {
          const err18 = { instancePath: instancePath + "/io.openit.variant", schemaPath: "#/properties/io.openit.variant/pattern", keyword: "pattern", params: { pattern: "^[a-z][a-z0-9-]*$" }, message: 'must match pattern "^[a-z][a-z0-9-]*$"' };
          if (vErrors === null) {
            vErrors = [err18];
          } else {
            vErrors.push(err18);
          }
          errors++;
        }
      } else {
        const err19 = { instancePath: instancePath + "/io.openit.variant", schemaPath: "#/properties/io.openit.variant/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err19];
        } else {
          vErrors.push(err19);
        }
        errors++;
      }
    }
    if (data["io.openit.app-version"] !== void 0) {
      let data6 = data["io.openit.app-version"];
      if (typeof data6 === "string") {
        if (func1(data6) < 1) {
          const err20 = { instancePath: instancePath + "/io.openit.app-version", schemaPath: "#/properties/io.openit.app-version/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" };
          if (vErrors === null) {
            vErrors = [err20];
          } else {
            vErrors.push(err20);
          }
          errors++;
        }
      } else {
        const err21 = { instancePath: instancePath + "/io.openit.app-version", schemaPath: "#/properties/io.openit.app-version/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err21];
        } else {
          vErrors.push(err21);
        }
        errors++;
      }
    }
    if (data["io.openit.langgraph"] !== void 0) {
      let data7 = data["io.openit.langgraph"];
      if (typeof data7 === "string") {
        if (func1(data7) < 1) {
          const err22 = { instancePath: instancePath + "/io.openit.langgraph", schemaPath: "#/properties/io.openit.langgraph/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" };
          if (vErrors === null) {
            vErrors = [err22];
          } else {
            vErrors.push(err22);
          }
          errors++;
        }
      } else {
        const err23 = { instancePath: instancePath + "/io.openit.langgraph", schemaPath: "#/properties/io.openit.langgraph/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err23];
        } else {
          vErrors.push(err23);
        }
        errors++;
      }
    }
    if (data["io.openit.jobs"] !== void 0) {
      if (typeof data["io.openit.jobs"] !== "string") {
        const err24 = { instancePath: instancePath + "/io.openit.jobs", schemaPath: "#/properties/io.openit.jobs/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err24];
        } else {
          vErrors.push(err24);
        }
        errors++;
      }
    }
    if (data["io.openit.exposure"] !== void 0) {
      if (typeof data["io.openit.exposure"] !== "string") {
        const err25 = { instancePath: instancePath + "/io.openit.exposure", schemaPath: "#/properties/io.openit.exposure/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err25];
        } else {
          vErrors.push(err25);
        }
        errors++;
      }
    }
    if (data["io.openit.database"] !== void 0) {
      if (typeof data["io.openit.database"] !== "string") {
        const err26 = { instancePath: instancePath + "/io.openit.database", schemaPath: "#/properties/io.openit.database/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err26];
        } else {
          vErrors.push(err26);
        }
        errors++;
      }
    }
    if (data["io.openit.inputs"] !== void 0) {
      if (typeof data["io.openit.inputs"] !== "string") {
        const err27 = { instancePath: instancePath + "/io.openit.inputs", schemaPath: "#/properties/io.openit.inputs/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err27];
        } else {
          vErrors.push(err27);
        }
        errors++;
      }
    }
  } else {
    const err28 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err28];
    } else {
      vErrors.push(err28);
    }
    errors++;
  }
  validate23.errors = vErrors;
  return errors === 0;
}
validate23.evaluated = { "props": { "io.openit.service": true, "io.openit.revision": true, "io.openit.contracts.boundary": true, "io.openit.contracts.survey-schema": true, "io.openit.model-runtime": true, "io.openit.variant": true, "io.openit.app-version": true, "io.openit.langgraph": true, "io.openit.jobs": true, "io.openit.exposure": true, "io.openit.database": true, "io.openit.inputs": true }, "dynamicProps": false, "dynamicItems": false };
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
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.image === void 0) {
      const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "image" }, message: "must have required property 'image'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.image_id === void 0) {
      const err1 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "image_id" }, message: "must have required property 'image_id'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.labels === void 0) {
      const err2 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "labels" }, message: "must have required property 'labels'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    for (const key0 in data) {
      if (!(key0 === "image" || key0 === "image_id" || key0 === "labels")) {
        const err3 = { instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
        if (vErrors === null) {
          vErrors = [err3];
        } else {
          vErrors.push(err3);
        }
        errors++;
      }
    }
    if (data.image !== void 0) {
      let data0 = data.image;
      if (typeof data0 === "string") {
        if (!pattern13.test(data0)) {
          const err4 = { instancePath: instancePath + "/image", schemaPath: "#/properties/image/pattern", keyword: "pattern", params: { pattern: "^[a-z0-9./_-]+:[A-Za-z0-9._-]+$" }, message: 'must match pattern "^[a-z0-9./_-]+:[A-Za-z0-9._-]+$"' };
          if (vErrors === null) {
            vErrors = [err4];
          } else {
            vErrors.push(err4);
          }
          errors++;
        }
      } else {
        const err5 = { instancePath: instancePath + "/image", schemaPath: "#/properties/image/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      }
    }
    if (data.image_id !== void 0) {
      let data1 = data.image_id;
      if (typeof data1 === "string") {
        if (!pattern15.test(data1)) {
          const err6 = { instancePath: instancePath + "/image_id", schemaPath: "_common.schema.json#/$defs/Hash/pattern", keyword: "pattern", params: { pattern: "^sha256:[0-9a-f]{64}$" }, message: 'must match pattern "^sha256:[0-9a-f]{64}$"' };
          if (vErrors === null) {
            vErrors = [err6];
          } else {
            vErrors.push(err6);
          }
          errors++;
        }
      } else {
        const err7 = { instancePath: instancePath + "/image_id", schemaPath: "_common.schema.json#/$defs/Hash/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
    }
    if (data.labels !== void 0) {
      if (!validate23(data.labels, { instancePath: instancePath + "/labels", parentData: data, parentDataProperty: "labels", rootData, dynamicAnchors })) {
        vErrors = vErrors === null ? validate23.errors : vErrors.concat(validate23.errors);
        errors = vErrors.length;
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
  validate21.errors = vErrors;
  return errors === 0;
}
validate21.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
exports.SetupEnvReport = validate25;
var schema36 = { "$schema": "https://json-schema.org/draft/2020-12/schema", "$id": "SetupEnvReport.schema.json", "title": "SetupEnvReport", "description": "\uC601\uC5ED scripts/setup-env.sh \uADDC\uC57D\uC758 \uACB0\uACFC \uD55C \uC904 (\uC601\uC5ED -> deploy prepare-areas.sh). \uADDC\uC57D: \uC601\uC5ED\uC740 \uC790\uAE30 \uB9AC\uD3EC \uB8E8\uD2B8\uC5D0\uC11C `bash scripts/setup-env.sh` \uB85C \uC2DC\uD5D8 \uD658\uACBD(\uD30C\uC774\uC36C .venv \uB610\uB294 node_modules)\uC744 \uC900\uBE44\uD558\uACE0, \uC774\uBBF8 \uC900\uBE44\uB3FC \uC788\uC73C\uBA74 \uC544\uBB34\uAC83\uB3C4 \uBC14\uAFB8\uC9C0 \uC54A\uB294\uB2E4(\uBA71\uB4F1). \uC778\uC790 \uC5C6\uC74C. \uBE44\uBC00 \uAC12\uC744 \uB2E4\uB8E8\uAC70\uB098 \uCD9C\uB825\uD558\uC9C0 \uC54A\uB294\uB2E4. \uC885\uB8CC \uCF54\uB4DC 0 \uC131\uACF5, 0 \uC774 \uC544\uB2C8\uBA74 \uC2E4\uD328. \uC774 \uC2A4\uD0A4\uB9C8\uB294 \uADF8 \uACB0\uACFC\uB97C deploy \uAC00 \uC694\uC57D\uD45C\uC5D0 \uC4F0\uB294 \uBAA8\uC591\uC774\uB2E4(\uD604\uC7AC prepare-areas.sh \uB294 \uC885\uB8CC \uCF54\uB4DC\uC640 \uC18C\uC694 \uC2DC\uAC04\uB9CC \uC4F4\uB2E4: status \uB294 'ok' \uB610\uB294 'fail', \uC2A4\uD06C\uB9BD\uD2B8\xB7\uD3F4\uB354 \uBD80\uC7AC\uB294 deploy \uAC00 \uCC44\uC6B4\uB2E4). \uC601\uC5ED\uC774 environment\uB97C \uC120\uC5B8\uD558\uBA74 doctor.sh \uAC00 .venv\xB7node_modules \uACBD\uB85C\uB97C \uCD94\uCE21\uD558\uC9C0 \uC54A\uC544\uB3C4 \uB41C\uB2E4.", "x-producers": ["*"], "x-consumers": ["deploy"], "type": "object", "properties": { "area": { "type": "string", "pattern": "^[a-z][a-z0-9-]*$" }, "status": { "enum": ["ok", "fail", "script-missing", "folder-missing"] }, "exit_code": { "type": "integer", "minimum": 0, "maximum": 255 }, "seconds": { "type": "integer", "minimum": 0 }, "environment": { "type": "object", "properties": { "kind": { "enum": ["python-venv", "node-modules"] }, "path": { "type": "string", "pattern": "^[^/]" }, "test_command": { "type": "array", "minItems": 1, "items": { "type": "string", "minLength": 1 }, "description": "\uB9AC\uD3EC \uB8E8\uD2B8\uC5D0\uC11C \uC2E4\uD589\uD560 \uC2DC\uD5D8 \uBA85\uB839 argv. \uC178\uC744 \uAC70\uCE58\uC9C0 \uC54A\uB294\uB2E4. \uC885\uB8CC \uCF54\uB4DC 0\uC774\uBA74 \uD1B5\uACFC" } }, "required": ["kind", "path", "test_command"], "additionalProperties": false, "description": '\uC900\uBE44\uB41C \uC2DC\uD5D8 \uD658\uACBD(2.6.0 \uD655\uC815, OPEN_GAPS U43). path\uB294 \uC601\uC5ED \uB9AC\uD3EC \uB8E8\uD2B8 \uAE30\uC900 \uC0C1\uB300 \uACBD\uB85C. test_command\uB294 \uB9AC\uD3EC \uB8E8\uD2B8\uC5D0\uC11C \uC601\uC5ED \uC2DC\uD5D8 \uC804\uCCB4\uB97C \uB3CC\uB9AC\uB294 argv(\uC608: [".venv/bin/python","-m","pytest","-q"], ["npm","test"]). deploy\uB294 \uC774\uAC83\uB9CC \uC77D\uACE0 \uC774\uC6C3\uC758 .venv\xB7node_modules \uACBD\uB85C\uB098 \uC2DC\uD5D8 \uB3C4\uAD6C\uB97C \uC9D0\uC791\uD558\uC9C0 \uC54A\uB294\uB2E4(\uAD6C\uC870 \uADDC\uCE59 1). 3.0.0: status\uAC00 ok\uBA74 \uD544\uC218(\uC601\uC5ED\uC774 \uC900\uBE44\uD55C \uD658\uACBD\uACFC \uC2DC\uD5D8 \uBA85\uB839\uC744 \uBC18\uB4DC\uC2DC \uC120\uC5B8\uD55C\uB2E4). \uC2E4\uD328\xB7\uC2A4\uD06C\uB9BD\uD2B8 \uC5C6\uC74C\xB7\uD3F4\uB354 \uC5C6\uC74C \uBCF4\uACE0\uC5D0\uB294 \uC5C6\uB2E4.' } }, "required": ["area", "status", "exit_code", "seconds"], "additionalProperties": false, "allOf": [{ "if": { "properties": { "status": { "const": "ok" } }, "required": ["status"] }, "then": { "required": ["environment"] } }] };
var pattern24 = new RegExp("^[^/]", "u");
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
  const _errs2 = errors;
  let valid1 = true;
  const _errs3 = errors;
  if (data && typeof data == "object" && !Array.isArray(data)) {
    let missing0;
    if (data.status === void 0 && (missing0 = "status")) {
      const err0 = {};
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    } else {
      if (data.status !== void 0) {
        if ("ok" !== data.status) {
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
      if (data.environment === void 0) {
        const err2 = { instancePath, schemaPath: "#/allOf/0/then/required", keyword: "required", params: { missingProperty: "environment" }, message: "must have required property 'environment'" };
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
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.area === void 0) {
      const err4 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "area" }, message: "must have required property 'area'" };
      if (vErrors === null) {
        vErrors = [err4];
      } else {
        vErrors.push(err4);
      }
      errors++;
    }
    if (data.status === void 0) {
      const err5 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "status" }, message: "must have required property 'status'" };
      if (vErrors === null) {
        vErrors = [err5];
      } else {
        vErrors.push(err5);
      }
      errors++;
    }
    if (data.exit_code === void 0) {
      const err6 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "exit_code" }, message: "must have required property 'exit_code'" };
      if (vErrors === null) {
        vErrors = [err6];
      } else {
        vErrors.push(err6);
      }
      errors++;
    }
    if (data.seconds === void 0) {
      const err7 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "seconds" }, message: "must have required property 'seconds'" };
      if (vErrors === null) {
        vErrors = [err7];
      } else {
        vErrors.push(err7);
      }
      errors++;
    }
    for (const key0 in data) {
      if (!(key0 === "area" || key0 === "status" || key0 === "exit_code" || key0 === "seconds" || key0 === "environment")) {
        const err8 = { instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
        if (vErrors === null) {
          vErrors = [err8];
        } else {
          vErrors.push(err8);
        }
        errors++;
      }
    }
    if (data.area !== void 0) {
      let data1 = data.area;
      if (typeof data1 === "string") {
        if (!pattern17.test(data1)) {
          const err9 = { instancePath: instancePath + "/area", schemaPath: "#/properties/area/pattern", keyword: "pattern", params: { pattern: "^[a-z][a-z0-9-]*$" }, message: 'must match pattern "^[a-z][a-z0-9-]*$"' };
          if (vErrors === null) {
            vErrors = [err9];
          } else {
            vErrors.push(err9);
          }
          errors++;
        }
      } else {
        const err10 = { instancePath: instancePath + "/area", schemaPath: "#/properties/area/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err10];
        } else {
          vErrors.push(err10);
        }
        errors++;
      }
    }
    if (data.status !== void 0) {
      let data2 = data.status;
      if (!(data2 === "ok" || data2 === "fail" || data2 === "script-missing" || data2 === "folder-missing")) {
        const err11 = { instancePath: instancePath + "/status", schemaPath: "#/properties/status/enum", keyword: "enum", params: { allowedValues: schema36.properties.status.enum }, message: "must be equal to one of the allowed values" };
        if (vErrors === null) {
          vErrors = [err11];
        } else {
          vErrors.push(err11);
        }
        errors++;
      }
    }
    if (data.exit_code !== void 0) {
      let data3 = data.exit_code;
      if (!(typeof data3 == "number" && (!(data3 % 1) && !isNaN(data3)))) {
        const err12 = { instancePath: instancePath + "/exit_code", schemaPath: "#/properties/exit_code/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
        if (vErrors === null) {
          vErrors = [err12];
        } else {
          vErrors.push(err12);
        }
        errors++;
      }
      if (typeof data3 == "number") {
        if (data3 > 255 || isNaN(data3)) {
          const err13 = { instancePath: instancePath + "/exit_code", schemaPath: "#/properties/exit_code/maximum", keyword: "maximum", params: { comparison: "<=", limit: 255 }, message: "must be <= 255" };
          if (vErrors === null) {
            vErrors = [err13];
          } else {
            vErrors.push(err13);
          }
          errors++;
        }
        if (data3 < 0 || isNaN(data3)) {
          const err14 = { instancePath: instancePath + "/exit_code", schemaPath: "#/properties/exit_code/minimum", keyword: "minimum", params: { comparison: ">=", limit: 0 }, message: "must be >= 0" };
          if (vErrors === null) {
            vErrors = [err14];
          } else {
            vErrors.push(err14);
          }
          errors++;
        }
      }
    }
    if (data.seconds !== void 0) {
      let data4 = data.seconds;
      if (!(typeof data4 == "number" && (!(data4 % 1) && !isNaN(data4)))) {
        const err15 = { instancePath: instancePath + "/seconds", schemaPath: "#/properties/seconds/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
        if (vErrors === null) {
          vErrors = [err15];
        } else {
          vErrors.push(err15);
        }
        errors++;
      }
      if (typeof data4 == "number") {
        if (data4 < 0 || isNaN(data4)) {
          const err16 = { instancePath: instancePath + "/seconds", schemaPath: "#/properties/seconds/minimum", keyword: "minimum", params: { comparison: ">=", limit: 0 }, message: "must be >= 0" };
          if (vErrors === null) {
            vErrors = [err16];
          } else {
            vErrors.push(err16);
          }
          errors++;
        }
      }
    }
    if (data.environment !== void 0) {
      let data5 = data.environment;
      if (data5 && typeof data5 == "object" && !Array.isArray(data5)) {
        if (data5.kind === void 0) {
          const err17 = { instancePath: instancePath + "/environment", schemaPath: "#/properties/environment/required", keyword: "required", params: { missingProperty: "kind" }, message: "must have required property 'kind'" };
          if (vErrors === null) {
            vErrors = [err17];
          } else {
            vErrors.push(err17);
          }
          errors++;
        }
        if (data5.path === void 0) {
          const err18 = { instancePath: instancePath + "/environment", schemaPath: "#/properties/environment/required", keyword: "required", params: { missingProperty: "path" }, message: "must have required property 'path'" };
          if (vErrors === null) {
            vErrors = [err18];
          } else {
            vErrors.push(err18);
          }
          errors++;
        }
        if (data5.test_command === void 0) {
          const err19 = { instancePath: instancePath + "/environment", schemaPath: "#/properties/environment/required", keyword: "required", params: { missingProperty: "test_command" }, message: "must have required property 'test_command'" };
          if (vErrors === null) {
            vErrors = [err19];
          } else {
            vErrors.push(err19);
          }
          errors++;
        }
        for (const key1 in data5) {
          if (!(key1 === "kind" || key1 === "path" || key1 === "test_command")) {
            const err20 = { instancePath: instancePath + "/environment", schemaPath: "#/properties/environment/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key1 }, message: "must NOT have additional properties" };
            if (vErrors === null) {
              vErrors = [err20];
            } else {
              vErrors.push(err20);
            }
            errors++;
          }
        }
        if (data5.kind !== void 0) {
          let data6 = data5.kind;
          if (!(data6 === "python-venv" || data6 === "node-modules")) {
            const err21 = { instancePath: instancePath + "/environment/kind", schemaPath: "#/properties/environment/properties/kind/enum", keyword: "enum", params: { allowedValues: schema36.properties.environment.properties.kind.enum }, message: "must be equal to one of the allowed values" };
            if (vErrors === null) {
              vErrors = [err21];
            } else {
              vErrors.push(err21);
            }
            errors++;
          }
        }
        if (data5.path !== void 0) {
          let data7 = data5.path;
          if (typeof data7 === "string") {
            if (!pattern24.test(data7)) {
              const err22 = { instancePath: instancePath + "/environment/path", schemaPath: "#/properties/environment/properties/path/pattern", keyword: "pattern", params: { pattern: "^[^/]" }, message: 'must match pattern "^[^/]"' };
              if (vErrors === null) {
                vErrors = [err22];
              } else {
                vErrors.push(err22);
              }
              errors++;
            }
          } else {
            const err23 = { instancePath: instancePath + "/environment/path", schemaPath: "#/properties/environment/properties/path/type", keyword: "type", params: { type: "string" }, message: "must be string" };
            if (vErrors === null) {
              vErrors = [err23];
            } else {
              vErrors.push(err23);
            }
            errors++;
          }
        }
        if (data5.test_command !== void 0) {
          let data8 = data5.test_command;
          if (Array.isArray(data8)) {
            if (data8.length < 1) {
              const err24 = { instancePath: instancePath + "/environment/test_command", schemaPath: "#/properties/environment/properties/test_command/minItems", keyword: "minItems", params: { limit: 1 }, message: "must NOT have fewer than 1 items" };
              if (vErrors === null) {
                vErrors = [err24];
              } else {
                vErrors.push(err24);
              }
              errors++;
            }
            const len0 = data8.length;
            for (let i0 = 0; i0 < len0; i0++) {
              let data9 = data8[i0];
              if (typeof data9 === "string") {
                if (func1(data9) < 1) {
                  const err25 = { instancePath: instancePath + "/environment/test_command/" + i0, schemaPath: "#/properties/environment/properties/test_command/items/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" };
                  if (vErrors === null) {
                    vErrors = [err25];
                  } else {
                    vErrors.push(err25);
                  }
                  errors++;
                }
              } else {
                const err26 = { instancePath: instancePath + "/environment/test_command/" + i0, schemaPath: "#/properties/environment/properties/test_command/items/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                if (vErrors === null) {
                  vErrors = [err26];
                } else {
                  vErrors.push(err26);
                }
                errors++;
              }
            }
          } else {
            const err27 = { instancePath: instancePath + "/environment/test_command", schemaPath: "#/properties/environment/properties/test_command/type", keyword: "type", params: { type: "array" }, message: "must be array" };
            if (vErrors === null) {
              vErrors = [err27];
            } else {
              vErrors.push(err27);
            }
            errors++;
          }
        }
      } else {
        const err28 = { instancePath: instancePath + "/environment", schemaPath: "#/properties/environment/type", keyword: "type", params: { type: "object" }, message: "must be object" };
        if (vErrors === null) {
          vErrors = [err28];
        } else {
          vErrors.push(err28);
        }
        errors++;
      }
    }
  } else {
    const err29 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err29];
    } else {
      vErrors.push(err29);
    }
    errors++;
  }
  validate25.errors = vErrors;
  return errors === 0;
}
validate25.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
exports.Exposure = validate26;
var schema38 = { "type": "object", "properties": { "paths": { "type": "array", "minItems": 1, "items": { "type": "string", "pattern": "^/" } }, "methods": { "type": "array", "uniqueItems": true, "items": { "enum": ["GET", "POST", "PUT", "PATCH", "DELETE"] }, "description": "\uBE44\uC6B0\uBA74 \uBAA8\uB4E0 \uBA54\uC11C\uB4DC" }, "auth": { "type": "object", "properties": { "kind": { "enum": ["device-token", "account", "authenticated", "machine-token", "none", "denied"], "description": "device-token: \uD0A4\uC624\uC2A4\uD06C \uAE30\uAE30(mTLS/\uAE30\uAE30 \uD1A0\uD070). account: \uC0AC\uB78C \uACC4\uC815(roles \uD544\uC218). authenticated: \uB85C\uADF8\uC778\uD55C \uC0AC\uB78C \uACC4\uC815\uC774\uBA74 \uC5ED\uD560\uACFC \uBB34\uAD00\uD558\uAC8C \uC5F0\uB2E4(3.4.0, U82: \uB370\uC774\uD130 \uC5C6\uB294 \uD654\uBA74 \uC815\uC801 \uD30C\uC77C \u2014 \uAC00\uC785 \uC2B9\uC778 \uB300\uAE30 \uACC4\uC815\uC5D0\uAC8C \uC548\uB0B4\uB97C \uBCF4\uC774\uB824\uBA74 \uD654\uBA74\uC774 \uC5F4\uB824\uC57C \uD55C\uB2E4; roles \uB97C \uC4F0\uC9C0 \uC54A\uB294\uB2E4). machine-token: (3.4.7 \uC815\uC815) \uBE44\uC0AC\uB78C \uD638\uCD9C\uC790\uC758 \uACBD\uB85C. \uAC8C\uC774\uD2B8\uC6E8\uC774\uB294 \uD1A0\uD070\uC744 \uB300\uC870\uD558\uC9C0 \uC54A\uACE0 \uBC1B\uB294 \uC11C\uBE44\uC2A4\uAC00 \uB300\uC870\uD55C\uB2E4(RUNTIME R3.23). platform \uACF5\uAC1C \uC785\uAD6C\uB294 \uC774 \uACBD\uB85C\uB97C \uB0B4\uBCF4\uB0B4\uC9C0 \uC54A\uB294\uB2E4(denied \uC640 \uAC19\uB2E4): compose \uBC16 \uD638\uCD9C\uC790\uB294 R1.5 \uC758 hosts \uD45C\uB85C \uBC1B\uB294 \uC601\uC5ED\uC758 \uAC8C\uC774\uD2B8\uC6E8\uC774\uC5D0 \uBC14\uB85C \uAC04\uB2E4. \uAC12\uC740 4.0.0 \uC5D0\uC11C \uBE80\uB2E4. none: \uC778\uC99D \uC5C6\uC74C(/healthz \uB4F1). (3.4.9) \uC601\uC5ED\uC758 /healthz\xB7/readyz\xB7/metrics \uB294 \uC601\uC5ED \uAC8C\uC774\uD2B8\uC6E8\uC774 \uC6A9\uC774\uACE0 platform \uACF5\uAC1C \uC785\uAD6C\uB294 \uB0B4\uBCF4\uB0B4\uC9C0 \uC54A\uB294\uB2E4(CONVENTIONS 2\uC808 \uC0C1\uD0DC \uACBD\uB85C \uADDC\uCE59). denied: \uBC16\uC5D0\uC11C \uB2FF\uC744 \uC218 \uC5C6\uC74C denied \uB294 platform \uACF5\uAC1C \uC785\uAD6C\uC5D0\uC11C \uB0B4\uBCF4\uB0B4\uC9C0 \uC54A\uB294\uB2E4\uB294 \uB73B\uC774\uB2E4. \uC601\uC5ED \uAC8C\uC774\uD2B8\uC6E8\uC774\uC5D0\uC11C \uC774 \uACBD\uB85C\uB97C \uC81C\uAC70\uD558\uC9C0 \uC54A\uB294\uB2E4. \uC601\uC5ED \uAC04 \uC694\uCCAD\uC758 \uC11C\uBE44\uC2A4 \uD1A0\uD070\uC740 \uBC1B\uB294 \uC11C\uBE44\uC2A4\uAC00 \uAC80\uC0AC\uD55C\uB2E4(R3.23)." }, "roles": { "type": "array", "uniqueItems": true, "items": { "type": "string", "pattern": "^[a-z][a-z-]*$" } } }, "required": ["kind"], "if": { "properties": { "kind": { "const": "account" } } }, "then": { "required": ["roles"], "properties": { "roles": { "minItems": 1 } } }, "additionalProperties": false }, "upstream_token": { "type": "string", "pattern": "^[a-z][a-z0-9-]*$", "description": "gateway \uAC00 \uC0C1\uB958\uC5D0 \uBD99\uC774\uB294 \uC11C\uBE44\uC2A4 \uD1A0\uD070\uC758 \uBE44\uBC00 \uC774\uB984(\uAC12 \uC544\uB2D8)" }, "user_header": { "enum": ["set", "strip"], "description": "set=\uC778\uC99D\uB41C \uACC4\uC815 ID \uB97C X-Openit-User \uB85C \uBD99\uC784(\uD074\uB77C\uC774\uC5B8\uD2B8 \uAC12\uC740 \uB36E\uC5B4\uC500), strip=\uC9C0\uC6C0" }, "streaming": { "type": "boolean" }, "timeouts_ms": { "type": "object", "properties": { "dial": { "type": "integer", "minimum": 1 }, "response_header": { "type": "integer", "minimum": 1 }, "read": { "type": "integer", "minimum": 1 } }, "additionalProperties": false }, "max_body_bytes": { "type": "integer", "minimum": 1, "maximum": 8589934592, "description": "3.4.7(RUNTIME R3.5\xB7R10.13): \uC774 \uACBD\uB85C\uC758 \uC694\uCCAD \uBCF8\uBB38 \uC0C1\uD55C(\uBC14\uC774\uD2B8). platform \uACF5\uAC1C \uC785\uAD6C\uC640 \uC601\uC5ED \uAC8C\uC774\uD2B8\uC6E8\uC774\uAC00 \uB458 \uB2E4 \uC774 \uAC12\uC73C\uB85C 413 \uC744 \uB0B8\uB2E4(\uC571\uC5D0 \uB2FF\uAE30 \uC804). \uC5C6\uC73C\uBA74 8MiB(8388608, \uC9C0\uAE08\uAE4C\uC9C0\uC758 \uACF5\uAC1C \uC785\uAD6C \uAE30\uBCF8, \uC2DC\uC791\uAC12\xB7\uCE21\uC815 \uC548 \uD568). \uC0C1\uD55C\uC740 \uD074\uB77C\uC774\uC5B8\uD2B8 max_tar_bytes 8GiB. \uAC12\uC740 \uBC1B\uB294 \uC601\uC5ED\uC774 ADR \uB85C \uADFC\uAC70\uC640 \uD568\uAED8 \uC815\uD55C\uB2E4" }, "upstream_port": { "type": "integer", "minimum": 1, "maximum": 65535, "description": "3.4.7: \uC601\uC5ED \uAC8C\uC774\uD2B8\uC6E8\uC774\uAC00 \uC774 \uACBD\uB85C\uB97C \uB118\uAE38 \uC601\uC5ED \uC548 \uCEF4\uD3EC\uB10C\uD2B8\uC758 loopback \uD3EC\uD2B8(\uAC19\uC740 \uB124\uD2B8\uC6CC\uD06C \uACF5\uAC04 127.0.0.1). \uC5C6\uC73C\uBA74 \uADF8 \uC601\uC5ED \uC11C\uBE44\uC2A4 \uD558\uB098(\uBC30\uD3EC \uC124\uC815\uC758 \uC571 \uD3EC\uD2B8)\uB85C \uB118\uAE34\uB2E4. \uC601\uC5ED \uC548 \uAD6C\uC131\uC740 \uC601\uC5ED\uC774 \uC815\uD558\uACE0, \uC774 \uAC12\uC740 \uBC30\uD3EC \uB54C \uAC8C\uC774\uD2B8\uC6E8\uC774 \uC124\uC815\uC744 \uB9CC\uB4DC\uB294 \uC785\uB825\uC774\uB2E4(CONVENTIONS 13\uC808 \uC608\uC678)" } }, "required": ["paths", "auth"], "additionalProperties": false };
var pattern28 = new RegExp("^[a-z][a-z-]*$", "u");
var func0 = require_equal().default;
var func9 = Object.prototype.hasOwnProperty;
function validate26(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  ;
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate26.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.service === void 0) {
      const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "service" }, message: "must have required property 'service'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.routes === void 0) {
      const err1 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "routes" }, message: "must have required property 'routes'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    for (const key0 in data) {
      if (!(key0 === "service" || key0 === "egress" || key0 === "routes")) {
        const err2 = { instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
        if (vErrors === null) {
          vErrors = [err2];
        } else {
          vErrors.push(err2);
        }
        errors++;
      }
    }
    if (data.service !== void 0) {
      let data0 = data.service;
      if (typeof data0 === "string") {
        if (!pattern17.test(data0)) {
          const err3 = { instancePath: instancePath + "/service", schemaPath: "#/properties/service/pattern", keyword: "pattern", params: { pattern: "^[a-z][a-z0-9-]*$" }, message: 'must match pattern "^[a-z][a-z0-9-]*$"' };
          if (vErrors === null) {
            vErrors = [err3];
          } else {
            vErrors.push(err3);
          }
          errors++;
        }
      } else {
        const err4 = { instancePath: instancePath + "/service", schemaPath: "#/properties/service/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err4];
        } else {
          vErrors.push(err4);
        }
        errors++;
      }
    }
    if (data.egress !== void 0) {
      let data1 = data.egress;
      if (Array.isArray(data1)) {
        const len0 = data1.length;
        for (let i0 = 0; i0 < len0; i0++) {
          let data2 = data1[i0];
          const _errs7 = errors;
          let valid3 = false;
          let passing0 = null;
          const _errs8 = errors;
          if (typeof data2 === "string") {
            if (!pattern17.test(data2)) {
              const err5 = { instancePath: instancePath + "/egress/" + i0, schemaPath: "#/properties/egress/items/oneOf/0/pattern", keyword: "pattern", params: { pattern: "^[a-z][a-z0-9-]*$" }, message: 'must match pattern "^[a-z][a-z0-9-]*$"' };
              if (vErrors === null) {
                vErrors = [err5];
              } else {
                vErrors.push(err5);
              }
              errors++;
            }
          } else {
            const err6 = { instancePath: instancePath + "/egress/" + i0, schemaPath: "#/properties/egress/items/oneOf/0/type", keyword: "type", params: { type: "string" }, message: "must be string" };
            if (vErrors === null) {
              vErrors = [err6];
            } else {
              vErrors.push(err6);
            }
            errors++;
          }
          var _valid0 = _errs8 === errors;
          if (_valid0) {
            valid3 = true;
            passing0 = 0;
          }
          const _errs10 = errors;
          if ("external:web-push" !== data2) {
            const err7 = { instancePath: instancePath + "/egress/" + i0, schemaPath: "#/properties/egress/items/oneOf/1/const", keyword: "const", params: { allowedValue: "external:web-push" }, message: "must be equal to constant" };
            if (vErrors === null) {
              vErrors = [err7];
            } else {
              vErrors.push(err7);
            }
            errors++;
          }
          var _valid0 = _errs10 === errors;
          if (_valid0 && valid3) {
            valid3 = false;
            passing0 = [passing0, 1];
          } else {
            if (_valid0) {
              valid3 = true;
              passing0 = 1;
            }
            const _errs11 = errors;
            if ("external:backup" !== data2) {
              const err8 = { instancePath: instancePath + "/egress/" + i0, schemaPath: "#/properties/egress/items/oneOf/2/const", keyword: "const", params: { allowedValue: "external:backup" }, message: "must be equal to constant" };
              if (vErrors === null) {
                vErrors = [err8];
              } else {
                vErrors.push(err8);
              }
              errors++;
            }
            var _valid0 = _errs11 === errors;
            if (_valid0 && valid3) {
              valid3 = false;
              passing0 = [passing0, 2];
            } else {
              if (_valid0) {
                valid3 = true;
                passing0 = 2;
              }
            }
          }
          if (!valid3) {
            const err9 = { instancePath: instancePath + "/egress/" + i0, schemaPath: "#/properties/egress/items/oneOf", keyword: "oneOf", params: { passingSchemas: passing0 }, message: "must match exactly one schema in oneOf" };
            if (vErrors === null) {
              vErrors = [err9];
            } else {
              vErrors.push(err9);
            }
            errors++;
          } else {
            errors = _errs7;
            if (vErrors !== null) {
              if (_errs7) {
                vErrors.length = _errs7;
              } else {
                vErrors = null;
              }
            }
          }
        }
        let i1 = data1.length;
        let j0;
        if (i1 > 1) {
          outer0: for (; i1--; ) {
            for (j0 = i1; j0--; ) {
              if (func0(data1[i1], data1[j0])) {
                const err10 = { instancePath: instancePath + "/egress", schemaPath: "#/properties/egress/uniqueItems", keyword: "uniqueItems", params: { i: i1, j: j0 }, message: "must NOT have duplicate items (items ## " + j0 + " and " + i1 + " are identical)" };
                if (vErrors === null) {
                  vErrors = [err10];
                } else {
                  vErrors.push(err10);
                }
                errors++;
                break outer0;
              }
            }
          }
        }
      } else {
        const err11 = { instancePath: instancePath + "/egress", schemaPath: "#/properties/egress/type", keyword: "type", params: { type: "array" }, message: "must be array" };
        if (vErrors === null) {
          vErrors = [err11];
        } else {
          vErrors.push(err11);
        }
        errors++;
      }
    }
    if (data.routes !== void 0) {
      let data3 = data.routes;
      if (Array.isArray(data3)) {
        if (data3.length < 1) {
          const err12 = { instancePath: instancePath + "/routes", schemaPath: "#/properties/routes/minItems", keyword: "minItems", params: { limit: 1 }, message: "must NOT have fewer than 1 items" };
          if (vErrors === null) {
            vErrors = [err12];
          } else {
            vErrors.push(err12);
          }
          errors++;
        }
        const len1 = data3.length;
        for (let i2 = 0; i2 < len1; i2++) {
          let data4 = data3[i2];
          if (data4 && typeof data4 == "object" && !Array.isArray(data4)) {
            if (data4.paths === void 0) {
              const err13 = { instancePath: instancePath + "/routes/" + i2, schemaPath: "#/$defs/route/required", keyword: "required", params: { missingProperty: "paths" }, message: "must have required property 'paths'" };
              if (vErrors === null) {
                vErrors = [err13];
              } else {
                vErrors.push(err13);
              }
              errors++;
            }
            if (data4.auth === void 0) {
              const err14 = { instancePath: instancePath + "/routes/" + i2, schemaPath: "#/$defs/route/required", keyword: "required", params: { missingProperty: "auth" }, message: "must have required property 'auth'" };
              if (vErrors === null) {
                vErrors = [err14];
              } else {
                vErrors.push(err14);
              }
              errors++;
            }
            for (const key1 in data4) {
              if (!func9.call(schema38.properties, key1)) {
                const err15 = { instancePath: instancePath + "/routes/" + i2, schemaPath: "#/$defs/route/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key1 }, message: "must NOT have additional properties" };
                if (vErrors === null) {
                  vErrors = [err15];
                } else {
                  vErrors.push(err15);
                }
                errors++;
              }
            }
            if (data4.paths !== void 0) {
              let data5 = data4.paths;
              if (Array.isArray(data5)) {
                if (data5.length < 1) {
                  const err16 = { instancePath: instancePath + "/routes/" + i2 + "/paths", schemaPath: "#/$defs/route/properties/paths/minItems", keyword: "minItems", params: { limit: 1 }, message: "must NOT have fewer than 1 items" };
                  if (vErrors === null) {
                    vErrors = [err16];
                  } else {
                    vErrors.push(err16);
                  }
                  errors++;
                }
                const len2 = data5.length;
                for (let i3 = 0; i3 < len2; i3++) {
                  let data6 = data5[i3];
                  if (typeof data6 === "string") {
                    if (!pattern4.test(data6)) {
                      const err17 = { instancePath: instancePath + "/routes/" + i2 + "/paths/" + i3, schemaPath: "#/$defs/route/properties/paths/items/pattern", keyword: "pattern", params: { pattern: "^/" }, message: 'must match pattern "^/"' };
                      if (vErrors === null) {
                        vErrors = [err17];
                      } else {
                        vErrors.push(err17);
                      }
                      errors++;
                    }
                  } else {
                    const err18 = { instancePath: instancePath + "/routes/" + i2 + "/paths/" + i3, schemaPath: "#/$defs/route/properties/paths/items/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                    if (vErrors === null) {
                      vErrors = [err18];
                    } else {
                      vErrors.push(err18);
                    }
                    errors++;
                  }
                }
              } else {
                const err19 = { instancePath: instancePath + "/routes/" + i2 + "/paths", schemaPath: "#/$defs/route/properties/paths/type", keyword: "type", params: { type: "array" }, message: "must be array" };
                if (vErrors === null) {
                  vErrors = [err19];
                } else {
                  vErrors.push(err19);
                }
                errors++;
              }
            }
            if (data4.methods !== void 0) {
              let data7 = data4.methods;
              if (Array.isArray(data7)) {
                const len3 = data7.length;
                for (let i4 = 0; i4 < len3; i4++) {
                  let data8 = data7[i4];
                  if (!(data8 === "GET" || data8 === "POST" || data8 === "PUT" || data8 === "PATCH" || data8 === "DELETE")) {
                    const err20 = { instancePath: instancePath + "/routes/" + i2 + "/methods/" + i4, schemaPath: "#/$defs/route/properties/methods/items/enum", keyword: "enum", params: { allowedValues: schema38.properties.methods.items.enum }, message: "must be equal to one of the allowed values" };
                    if (vErrors === null) {
                      vErrors = [err20];
                    } else {
                      vErrors.push(err20);
                    }
                    errors++;
                  }
                }
                let i5 = data7.length;
                let j1;
                if (i5 > 1) {
                  outer1: for (; i5--; ) {
                    for (j1 = i5; j1--; ) {
                      if (func0(data7[i5], data7[j1])) {
                        const err21 = { instancePath: instancePath + "/routes/" + i2 + "/methods", schemaPath: "#/$defs/route/properties/methods/uniqueItems", keyword: "uniqueItems", params: { i: i5, j: j1 }, message: "must NOT have duplicate items (items ## " + j1 + " and " + i5 + " are identical)" };
                        if (vErrors === null) {
                          vErrors = [err21];
                        } else {
                          vErrors.push(err21);
                        }
                        errors++;
                        break outer1;
                      }
                    }
                  }
                }
              } else {
                const err22 = { instancePath: instancePath + "/routes/" + i2 + "/methods", schemaPath: "#/$defs/route/properties/methods/type", keyword: "type", params: { type: "array" }, message: "must be array" };
                if (vErrors === null) {
                  vErrors = [err22];
                } else {
                  vErrors.push(err22);
                }
                errors++;
              }
            }
            if (data4.auth !== void 0) {
              let data9 = data4.auth;
              const _errs27 = errors;
              let valid14 = true;
              const _errs28 = errors;
              if (data9 && typeof data9 == "object" && !Array.isArray(data9)) {
                if (data9.kind !== void 0) {
                  if ("account" !== data9.kind) {
                    const err23 = {};
                    if (vErrors === null) {
                      vErrors = [err23];
                    } else {
                      vErrors.push(err23);
                    }
                    errors++;
                  }
                }
              }
              var _valid1 = _errs28 === errors;
              errors = _errs27;
              if (vErrors !== null) {
                if (_errs27) {
                  vErrors.length = _errs27;
                } else {
                  vErrors = null;
                }
              }
              if (_valid1) {
                const _errs30 = errors;
                if (data9 && typeof data9 == "object" && !Array.isArray(data9)) {
                  if (data9.roles === void 0) {
                    const err24 = { instancePath: instancePath + "/routes/" + i2 + "/auth", schemaPath: "#/$defs/route/properties/auth/then/required", keyword: "required", params: { missingProperty: "roles" }, message: "must have required property 'roles'" };
                    if (vErrors === null) {
                      vErrors = [err24];
                    } else {
                      vErrors.push(err24);
                    }
                    errors++;
                  }
                  if (data9.roles !== void 0) {
                    let data11 = data9.roles;
                    if (Array.isArray(data11)) {
                      if (data11.length < 1) {
                        const err25 = { instancePath: instancePath + "/routes/" + i2 + "/auth/roles", schemaPath: "#/$defs/route/properties/auth/then/properties/roles/minItems", keyword: "minItems", params: { limit: 1 }, message: "must NOT have fewer than 1 items" };
                        if (vErrors === null) {
                          vErrors = [err25];
                        } else {
                          vErrors.push(err25);
                        }
                        errors++;
                      }
                    }
                  }
                }
                var _valid1 = _errs30 === errors;
                valid14 = _valid1;
                if (valid14) {
                  var props0 = {};
                  props0.roles = true;
                  props0.kind = true;
                }
              }
              if (!valid14) {
                const err26 = { instancePath: instancePath + "/routes/" + i2 + "/auth", schemaPath: "#/$defs/route/properties/auth/if", keyword: "if", params: { failingKeyword: "then" }, message: 'must match "then" schema' };
                if (vErrors === null) {
                  vErrors = [err26];
                } else {
                  vErrors.push(err26);
                }
                errors++;
              }
              if (data9 && typeof data9 == "object" && !Array.isArray(data9)) {
                if (data9.kind === void 0) {
                  const err27 = { instancePath: instancePath + "/routes/" + i2 + "/auth", schemaPath: "#/$defs/route/properties/auth/required", keyword: "required", params: { missingProperty: "kind" }, message: "must have required property 'kind'" };
                  if (vErrors === null) {
                    vErrors = [err27];
                  } else {
                    vErrors.push(err27);
                  }
                  errors++;
                }
                for (const key2 in data9) {
                  if (!(key2 === "kind" || key2 === "roles")) {
                    const err28 = { instancePath: instancePath + "/routes/" + i2 + "/auth", schemaPath: "#/$defs/route/properties/auth/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key2 }, message: "must NOT have additional properties" };
                    if (vErrors === null) {
                      vErrors = [err28];
                    } else {
                      vErrors.push(err28);
                    }
                    errors++;
                  }
                }
                if (data9.kind !== void 0) {
                  let data12 = data9.kind;
                  if (!(data12 === "device-token" || data12 === "account" || data12 === "authenticated" || data12 === "machine-token" || data12 === "none" || data12 === "denied")) {
                    const err29 = { instancePath: instancePath + "/routes/" + i2 + "/auth/kind", schemaPath: "#/$defs/route/properties/auth/properties/kind/enum", keyword: "enum", params: { allowedValues: schema38.properties.auth.properties.kind.enum }, message: "must be equal to one of the allowed values" };
                    if (vErrors === null) {
                      vErrors = [err29];
                    } else {
                      vErrors.push(err29);
                    }
                    errors++;
                  }
                }
                if (data9.roles !== void 0) {
                  let data13 = data9.roles;
                  if (Array.isArray(data13)) {
                    const len4 = data13.length;
                    for (let i6 = 0; i6 < len4; i6++) {
                      let data14 = data13[i6];
                      if (typeof data14 === "string") {
                        if (!pattern28.test(data14)) {
                          const err30 = { instancePath: instancePath + "/routes/" + i2 + "/auth/roles/" + i6, schemaPath: "#/$defs/route/properties/auth/properties/roles/items/pattern", keyword: "pattern", params: { pattern: "^[a-z][a-z-]*$" }, message: 'must match pattern "^[a-z][a-z-]*$"' };
                          if (vErrors === null) {
                            vErrors = [err30];
                          } else {
                            vErrors.push(err30);
                          }
                          errors++;
                        }
                      } else {
                        const err31 = { instancePath: instancePath + "/routes/" + i2 + "/auth/roles/" + i6, schemaPath: "#/$defs/route/properties/auth/properties/roles/items/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                        if (vErrors === null) {
                          vErrors = [err31];
                        } else {
                          vErrors.push(err31);
                        }
                        errors++;
                      }
                    }
                    let i7 = data13.length;
                    let j2;
                    if (i7 > 1) {
                      const indices0 = {};
                      for (; i7--; ) {
                        let item0 = data13[i7];
                        if (typeof item0 !== "string") {
                          continue;
                        }
                        if (typeof indices0[item0] == "number") {
                          j2 = indices0[item0];
                          const err32 = { instancePath: instancePath + "/routes/" + i2 + "/auth/roles", schemaPath: "#/$defs/route/properties/auth/properties/roles/uniqueItems", keyword: "uniqueItems", params: { i: i7, j: j2 }, message: "must NOT have duplicate items (items ## " + j2 + " and " + i7 + " are identical)" };
                          if (vErrors === null) {
                            vErrors = [err32];
                          } else {
                            vErrors.push(err32);
                          }
                          errors++;
                          break;
                        }
                        indices0[item0] = i7;
                      }
                    }
                  } else {
                    const err33 = { instancePath: instancePath + "/routes/" + i2 + "/auth/roles", schemaPath: "#/$defs/route/properties/auth/properties/roles/type", keyword: "type", params: { type: "array" }, message: "must be array" };
                    if (vErrors === null) {
                      vErrors = [err33];
                    } else {
                      vErrors.push(err33);
                    }
                    errors++;
                  }
                }
              } else {
                const err34 = { instancePath: instancePath + "/routes/" + i2 + "/auth", schemaPath: "#/$defs/route/properties/auth/type", keyword: "type", params: { type: "object" }, message: "must be object" };
                if (vErrors === null) {
                  vErrors = [err34];
                } else {
                  vErrors.push(err34);
                }
                errors++;
              }
            }
            if (data4.upstream_token !== void 0) {
              let data15 = data4.upstream_token;
              if (typeof data15 === "string") {
                if (!pattern17.test(data15)) {
                  const err35 = { instancePath: instancePath + "/routes/" + i2 + "/upstream_token", schemaPath: "#/$defs/route/properties/upstream_token/pattern", keyword: "pattern", params: { pattern: "^[a-z][a-z0-9-]*$" }, message: 'must match pattern "^[a-z][a-z0-9-]*$"' };
                  if (vErrors === null) {
                    vErrors = [err35];
                  } else {
                    vErrors.push(err35);
                  }
                  errors++;
                }
              } else {
                const err36 = { instancePath: instancePath + "/routes/" + i2 + "/upstream_token", schemaPath: "#/$defs/route/properties/upstream_token/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                if (vErrors === null) {
                  vErrors = [err36];
                } else {
                  vErrors.push(err36);
                }
                errors++;
              }
            }
            if (data4.user_header !== void 0) {
              let data16 = data4.user_header;
              if (!(data16 === "set" || data16 === "strip")) {
                const err37 = { instancePath: instancePath + "/routes/" + i2 + "/user_header", schemaPath: "#/$defs/route/properties/user_header/enum", keyword: "enum", params: { allowedValues: schema38.properties.user_header.enum }, message: "must be equal to one of the allowed values" };
                if (vErrors === null) {
                  vErrors = [err37];
                } else {
                  vErrors.push(err37);
                }
                errors++;
              }
            }
            if (data4.streaming !== void 0) {
              if (typeof data4.streaming !== "boolean") {
                const err38 = { instancePath: instancePath + "/routes/" + i2 + "/streaming", schemaPath: "#/$defs/route/properties/streaming/type", keyword: "type", params: { type: "boolean" }, message: "must be boolean" };
                if (vErrors === null) {
                  vErrors = [err38];
                } else {
                  vErrors.push(err38);
                }
                errors++;
              }
            }
            if (data4.timeouts_ms !== void 0) {
              let data18 = data4.timeouts_ms;
              if (data18 && typeof data18 == "object" && !Array.isArray(data18)) {
                for (const key3 in data18) {
                  if (!(key3 === "dial" || key3 === "response_header" || key3 === "read")) {
                    const err39 = { instancePath: instancePath + "/routes/" + i2 + "/timeouts_ms", schemaPath: "#/$defs/route/properties/timeouts_ms/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key3 }, message: "must NOT have additional properties" };
                    if (vErrors === null) {
                      vErrors = [err39];
                    } else {
                      vErrors.push(err39);
                    }
                    errors++;
                  }
                }
                if (data18.dial !== void 0) {
                  let data19 = data18.dial;
                  if (!(typeof data19 == "number" && (!(data19 % 1) && !isNaN(data19)))) {
                    const err40 = { instancePath: instancePath + "/routes/" + i2 + "/timeouts_ms/dial", schemaPath: "#/$defs/route/properties/timeouts_ms/properties/dial/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
                    if (vErrors === null) {
                      vErrors = [err40];
                    } else {
                      vErrors.push(err40);
                    }
                    errors++;
                  }
                  if (typeof data19 == "number") {
                    if (data19 < 1 || isNaN(data19)) {
                      const err41 = { instancePath: instancePath + "/routes/" + i2 + "/timeouts_ms/dial", schemaPath: "#/$defs/route/properties/timeouts_ms/properties/dial/minimum", keyword: "minimum", params: { comparison: ">=", limit: 1 }, message: "must be >= 1" };
                      if (vErrors === null) {
                        vErrors = [err41];
                      } else {
                        vErrors.push(err41);
                      }
                      errors++;
                    }
                  }
                }
                if (data18.response_header !== void 0) {
                  let data20 = data18.response_header;
                  if (!(typeof data20 == "number" && (!(data20 % 1) && !isNaN(data20)))) {
                    const err42 = { instancePath: instancePath + "/routes/" + i2 + "/timeouts_ms/response_header", schemaPath: "#/$defs/route/properties/timeouts_ms/properties/response_header/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
                    if (vErrors === null) {
                      vErrors = [err42];
                    } else {
                      vErrors.push(err42);
                    }
                    errors++;
                  }
                  if (typeof data20 == "number") {
                    if (data20 < 1 || isNaN(data20)) {
                      const err43 = { instancePath: instancePath + "/routes/" + i2 + "/timeouts_ms/response_header", schemaPath: "#/$defs/route/properties/timeouts_ms/properties/response_header/minimum", keyword: "minimum", params: { comparison: ">=", limit: 1 }, message: "must be >= 1" };
                      if (vErrors === null) {
                        vErrors = [err43];
                      } else {
                        vErrors.push(err43);
                      }
                      errors++;
                    }
                  }
                }
                if (data18.read !== void 0) {
                  let data21 = data18.read;
                  if (!(typeof data21 == "number" && (!(data21 % 1) && !isNaN(data21)))) {
                    const err44 = { instancePath: instancePath + "/routes/" + i2 + "/timeouts_ms/read", schemaPath: "#/$defs/route/properties/timeouts_ms/properties/read/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
                    if (vErrors === null) {
                      vErrors = [err44];
                    } else {
                      vErrors.push(err44);
                    }
                    errors++;
                  }
                  if (typeof data21 == "number") {
                    if (data21 < 1 || isNaN(data21)) {
                      const err45 = { instancePath: instancePath + "/routes/" + i2 + "/timeouts_ms/read", schemaPath: "#/$defs/route/properties/timeouts_ms/properties/read/minimum", keyword: "minimum", params: { comparison: ">=", limit: 1 }, message: "must be >= 1" };
                      if (vErrors === null) {
                        vErrors = [err45];
                      } else {
                        vErrors.push(err45);
                      }
                      errors++;
                    }
                  }
                }
              } else {
                const err46 = { instancePath: instancePath + "/routes/" + i2 + "/timeouts_ms", schemaPath: "#/$defs/route/properties/timeouts_ms/type", keyword: "type", params: { type: "object" }, message: "must be object" };
                if (vErrors === null) {
                  vErrors = [err46];
                } else {
                  vErrors.push(err46);
                }
                errors++;
              }
            }
            if (data4.max_body_bytes !== void 0) {
              let data22 = data4.max_body_bytes;
              if (!(typeof data22 == "number" && (!(data22 % 1) && !isNaN(data22)))) {
                const err47 = { instancePath: instancePath + "/routes/" + i2 + "/max_body_bytes", schemaPath: "#/$defs/route/properties/max_body_bytes/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
                if (vErrors === null) {
                  vErrors = [err47];
                } else {
                  vErrors.push(err47);
                }
                errors++;
              }
              if (typeof data22 == "number") {
                if (data22 > 8589934592 || isNaN(data22)) {
                  const err48 = { instancePath: instancePath + "/routes/" + i2 + "/max_body_bytes", schemaPath: "#/$defs/route/properties/max_body_bytes/maximum", keyword: "maximum", params: { comparison: "<=", limit: 8589934592 }, message: "must be <= 8589934592" };
                  if (vErrors === null) {
                    vErrors = [err48];
                  } else {
                    vErrors.push(err48);
                  }
                  errors++;
                }
                if (data22 < 1 || isNaN(data22)) {
                  const err49 = { instancePath: instancePath + "/routes/" + i2 + "/max_body_bytes", schemaPath: "#/$defs/route/properties/max_body_bytes/minimum", keyword: "minimum", params: { comparison: ">=", limit: 1 }, message: "must be >= 1" };
                  if (vErrors === null) {
                    vErrors = [err49];
                  } else {
                    vErrors.push(err49);
                  }
                  errors++;
                }
              }
            }
            if (data4.upstream_port !== void 0) {
              let data23 = data4.upstream_port;
              if (!(typeof data23 == "number" && (!(data23 % 1) && !isNaN(data23)))) {
                const err50 = { instancePath: instancePath + "/routes/" + i2 + "/upstream_port", schemaPath: "#/$defs/route/properties/upstream_port/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
                if (vErrors === null) {
                  vErrors = [err50];
                } else {
                  vErrors.push(err50);
                }
                errors++;
              }
              if (typeof data23 == "number") {
                if (data23 > 65535 || isNaN(data23)) {
                  const err51 = { instancePath: instancePath + "/routes/" + i2 + "/upstream_port", schemaPath: "#/$defs/route/properties/upstream_port/maximum", keyword: "maximum", params: { comparison: "<=", limit: 65535 }, message: "must be <= 65535" };
                  if (vErrors === null) {
                    vErrors = [err51];
                  } else {
                    vErrors.push(err51);
                  }
                  errors++;
                }
                if (data23 < 1 || isNaN(data23)) {
                  const err52 = { instancePath: instancePath + "/routes/" + i2 + "/upstream_port", schemaPath: "#/$defs/route/properties/upstream_port/minimum", keyword: "minimum", params: { comparison: ">=", limit: 1 }, message: "must be >= 1" };
                  if (vErrors === null) {
                    vErrors = [err52];
                  } else {
                    vErrors.push(err52);
                  }
                  errors++;
                }
              }
            }
          } else {
            const err53 = { instancePath: instancePath + "/routes/" + i2, schemaPath: "#/$defs/route/type", keyword: "type", params: { type: "object" }, message: "must be object" };
            if (vErrors === null) {
              vErrors = [err53];
            } else {
              vErrors.push(err53);
            }
            errors++;
          }
        }
      } else {
        const err54 = { instancePath: instancePath + "/routes", schemaPath: "#/properties/routes/type", keyword: "type", params: { type: "array" }, message: "must be array" };
        if (vErrors === null) {
          vErrors = [err54];
        } else {
          vErrors.push(err54);
        }
        errors++;
      }
    }
  } else {
    const err55 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err55];
    } else {
      vErrors.push(err55);
    }
    errors++;
  }
  validate26.errors = vErrors;
  return errors === 0;
}
validate26.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
exports.ContainerInputs = validate27;
var schema39 = { "$schema": "https://json-schema.org/draft/2020-12/schema", "$id": "https://openit.example/schemas/ContainerInputs.schema.json", "title": "ContainerInputs", "description": "3.5.0(2026-11-06): \uC601\uC5ED \uC774\uBBF8\uC9C0\uAC00 \uCEE8\uD14C\uC774\uB108 \uBC16(\uBC30\uCE58 \uC601\uC5ED)\uC5D0\uC11C \uC8FC\uC785\uBC1B\uC544\uC57C \uD558\uB294 \uAC83 \uC804\uBD80. \uC774\uBBF8\uC9C0\uB97C \uB9CC\uB4DC\uB294 \uC601\uC5ED\uC774 \uC120\uC5B8\uD558\uACE0(\uB77C\uBCA8 io.openit.inputs), \uB744\uC6B0\uB294 \uC601\uC5ED(deploy)\uC740 \uC774 \uC120\uC5B8\uACFC \uC815\uD655\uD788 \uAC19\uAC8C \uC8FC\uC785\uD55C\uB2E4. \uD658\uACBD \uBCC0\uC218\uC758 \uC774\uB984\xB7\uAC12\uC740 env_schema \uAC00 \uAC00\uB9AC\uD0A4\uB294 \uACC4\uC57D Env \uAC00 \uC815\uD55C\uB2E4. \uC774 \uC120\uC5B8\uC5D0 \uC5C6\uB294 \uC8FC\uC785(\uD30C\uC77C\xB7\uC4F0\uAE30 \uB9C8\uC6B4\uD2B8\xB7\uAD8C\uD55C)\uC740 \uD558\uC9C0 \uC54A\uACE0, \uC120\uC5B8\uB41C \uAC83\uC740 \uBE60\uB728\uB9AC\uC9C0 \uC54A\uB294\uB2E4. \uC65C: \uD30C\uC77C \uAD8C\uD55C\xB7\uC4F0\uAE30 \uACBD\uB85C\xB7\uC2E4\uD589 \uC0AC\uC6A9\uC790\xB7argv \uAC00 \uBB38\uC7A5 \uADDC\uCE59(CLAUDE.md '\uC774\uBBF8\uC9C0\uB294 \uB2E4\uC74C\uC744 \uC9C0\uD0A8\uB2E4')\uBFD0\uC774\uB77C \uB450 \uC601\uC5ED\uC774 \uAC01\uC790 \uD574\uC11D\uD588\uACE0, 2026-11-06 E2E \uAE30\uB3D9 \uC2E4\uD328 \uB124 \uAC74(DB \uBE44\uBC00 \uC77D\uAE30, TLS \uC0AC\uBCF8 \uACBD\uB85C, \uC7A1 argv, \uD1A0\uD070 \uC774\uB984)\uC774 \uBAA8\uB450 \uADF8 \uC5B4\uAE0B\uB0A8\uC774\uC5C8\uB2E4.", "x-producers": ["*"], "x-consumers": ["deploy"], "type": "object", "additionalProperties": false, "required": ["schema_version", "image", "read_only_root", "exec_absolute_argv", "role_env", "roles", "jobs"], "properties": { "schema_version": { "const": 1 }, "image": { "type": "string", "pattern": "^[a-z][a-z0-9-]*$", "description": "\uAC8C\uC2DC \uC774\uBBF8\uC9C0 \uC774\uB984(\uB77C\uBCA8 io.openit.service \uC640 \uAC19\uB2E4)" }, "read_only_root": { "const": true, "description": "\uB8E8\uD2B8 \uD30C\uC77C \uC2DC\uC2A4\uD15C\uC740 \uC77D\uAE30 \uC804\uC6A9\uC73C\uB85C \uB744\uC6B4\uB2E4. \uC4F0\uAE30\uB294 roles.*.writable \uC5D0 \uC120\uC5B8\uD55C \uACBD\uB85C\uB9CC" }, "exec_absolute_argv": { "const": true, "description": "\uBA85\uB839\uC758 \uCCAB \uC778\uC790\uAC00 \uC808\uB300 \uACBD\uB85C\uBA74 \uC774\uBBF8\uC9C0 \uC9C4\uC785\uC810\uC740 \uC11C\uBC84 \uC900\uBE44 \uC5C6\uC774 \uADF8 argv \uB97C \uADF8\uB300\uB85C \uC2E4\uD589\uD55C\uB2E4(\uC7A1 \uC120\uC5B8 JobsDeclaration.argv \uC758 \uC2E4\uD589 \uADDC\uCE59, Docker \uD45C\uC900 \uC9C4\uC785\uC810 \uAD00\uB840)" }, "role_env": { "type": ["string", "null"], "pattern": "^[A-Z][A-Z0-9_]*$", "description": "\uC5ED\uD560\uC744 \uACE0\uB974\uB294 \uD658\uACBD \uBCC0\uC218 \uC774\uB984(\uC608: STEP_ROLE). \uC5ED\uD560\uC774 \uD558\uB098\uBA74 null \uC774\uACE0 roles \uC758 \uD0A4\uB294 default \uD558\uB098\uB2E4" }, "roles": { "type": "object", "minProperties": 1, "propertyNames": { "pattern": "^[a-z][a-z0-9-]*$" }, "additionalProperties": { "allOf": [{ "$ref": "#/$defs/InputSet" }, { "not": { "required": ["config_paths"] } }] } }, "jobs": { "type": "object", "propertyNames": { "pattern": "^[a-z][a-z0-9-]*$" }, "additionalProperties": { "$ref": "#/$defs/InputSet" }, "description": "\uC7A1\uB9C8\uB2E4(\uD0A4 = \uC774 \uC774\uBBF8\uC9C0 \uB77C\uBCA8 io.openit.jobs \uC758 \uC7A1 \uC774\uB984, argv \uB85C \uACE0\uB978\uB2E4) \uADF8 \uC7A1 \uCEE8\uD14C\uC774\uB108\uAC00 \uBC1B\uB294 \uAC83. \uC7A1\uC774 \uC5C6\uC73C\uBA74 \uBE48 \uAC1D\uCCB4" } }, "allOf": [{ "if": { "properties": { "role_env": { "type": "null" } } }, "then": { "properties": { "roles": { "required": ["default"], "maxProperties": 1 } } } }], "$defs": { "Process": { "type": "object", "additionalProperties": false, "required": ["uid", "gid"], "description": "\uC8FC\uC785\uB41C \uD30C\uC77C\uC744 \uC77D\uACE0 \uC120\uC5B8\uB41C \uACBD\uB85C\uC5D0 \uC4F0\uB294 \uD504\uB85C\uC138\uC2A4\uC758 \uC22B\uC790 \uC0AC\uC6A9\uC790\xB7\uADF8\uB8F9. \uC774\uB984(app, postgres)\uC774 \uC544\uB2C8\uB77C \uC22B\uC790\uB2E4: \uBC30\uCE58 \uC601\uC5ED\uC740 \uC774\uBBF8\uC9C0 \uC548\uC758 /etc/passwd \uB97C \uBAA8\uB978\uB2E4(\uAD6C\uC870 \uADDC\uCE59 1)", "properties": { "uid": { "type": "integer", "minimum": 0, "maximum": 2147483647 }, "gid": { "type": "integer", "minimum": 0, "maximum": 2147483647 } } }, "File": { "type": "object", "additionalProperties": false, "required": ["path", "kind", "required", "opened_by"], "properties": { "path_env": { "type": ["string", "null"], "pattern": "^[A-Z][A-Z0-9_]*$", "description": "\uACBD\uB85C\uB97C \uC8FC\uB294 \uD658\uACBD \uBCC0\uC218(\uC608: DB_PASSWORD_FILE). null \uC774\uBA74 path \uACE0\uC815" }, "path": { "type": "string", "pattern": "^/[^\\s]*$", "description": "path_env \uAC00 \uC5C6\uC744 \uB54C \uC774\uBBF8\uC9C0\uAC00 \uC77D\uB294 \uACBD\uB85C(path_env \uAC00 \uC788\uC73C\uBA74 \uADF8 \uAE30\uBCF8\uAC12)" }, "directory": { "type": "boolean", "default": false, "description": "\uCC38\uC774\uBA74 \uD3F4\uB354(\uADF8 \uC548\uC758 \uD30C\uC77C \uC804\uBD80\uB97C \uC77D\uB294\uB2E4)" }, "kind": { "enum": ["secret", "config", "certificate", "ca-bundle", "declaration"], "description": "secret \uC740 \uAC12\uC774 \uBE44\uBC00\uC774\uB2E4(D84): \uBC30\uCE58 \uC601\uC5ED\uC740 \uB2E4\uB978 \uC0AC\uC6A9\uC790\uAC00 \uC77D\uC9C0 \uBABB\uD558\uAC8C \uC8FC\uB418 read_by \uB294 \uC77D\uC744 \uC218 \uC788\uC5B4\uC57C \uD55C\uB2E4" }, "schema": { "type": ["string", "null"], "pattern": "^[A-Z][A-Za-z0-9]*$", "description": "\uB0B4\uC6A9\uC774 \uB530\uB974\uB294 \uACC4\uC57D \uC2A4\uD0A4\uB9C8 \uC774\uB984(\uC788\uC73C\uBA74)" }, "required": { "type": "boolean" }, "opened_by": { "const": "start-process", "description": "\uC8FC\uC785\uB41C \uD30C\uC77C\uC740 \uCEE8\uD14C\uC774\uB108\uC758 \uC2DC\uC791 \uD504\uB85C\uC138\uC2A4(process \uC758 uid, \uBC30\uCE58 \uC601\uC5ED\uC774 \uBD99\uC778 \uBCF4\uC870 \uADF8\uB8F9 \uD3EC\uD568)\uAC00 \uC5F0\uB2E4. \uBC30\uCE58 \uC601\uC5ED\uC740 \uD30C\uC77C\uC744 0640\xB7\uADF8\uB8F9 SECRETS_GID \uB85C \uB450\uACE0 \uADF8 \uADF8\uB8F9\uC744 \uBCF4\uC870 \uADF8\uB8F9\uC73C\uB85C \uBD99\uC778\uB2E4. \uC0AC\uC6A9\uC790\uB97C \uBC14\uAFBC(gosu\xB7setpriv) \uB4A4\uC5D0\uB294 \uBCF4\uC870 \uADF8\uB8F9\uC774 \uC0AC\uB77C\uC9C0\uBBC0\uB85C \uADF8 \uC804\uC5D0 \uC5F4\uAC70\uB098 \uC2DC\uC791 \uD504\uB85C\uC138\uC2A4\uAC00 \uC790\uAE30 \uC0AC\uBCF8\uC744 \uB9CC\uB4E4\uC5B4 \uB118\uAE34\uB2E4(2026-11-06 DB \uBE44\uBC00 \uC77D\uAE30 \uC2E4\uD328\uC758 \uC6D0\uC778)" } } }, "Writable": { "type": "object", "additionalProperties": false, "required": ["path", "persist", "written_by"], "properties": { "path": { "type": "string", "pattern": "^/[^\\s]*$" }, "persist": { "type": "boolean", "description": "\uCC38\uC774\uBA74 \uB2E4\uC2DC \uC2DC\uC791\uD574\uB3C4 \uB0A8\uC544\uC57C \uD55C\uB2E4(\uC774\uB984 \uC788\uB294 \uBCFC\uB968). \uAC70\uC9D3\uC774\uBA74 tmpfs \uB85C \uCDA9\uBD84\uD558\uB2E4" }, "written_by": { "$ref": "#/$defs/Process", "description": "\uC774 \uACBD\uB85C\uC5D0 \uC4F0\uB294 \uD504\uB85C\uC138\uC2A4. \uBC30\uCE58 \uC601\uC5ED\uC740 \uC774 \uC0AC\uC6A9\uC790\uAC00 \uC4F8 \uC218 \uC788\uAC8C \uC900\uB2E4(tmpfs uid/gid/mode \uB610\uB294 \uBCFC\uB968 \uC18C\uC720)" } } }, "InputSet": { "type": "object", "additionalProperties": false, "required": ["env_schema", "process", "files", "writable", "capabilities", "sysctls"], "properties": { "env_schema": { "type": "string", "pattern": "^[A-Z][A-Za-z0-9]*Env$", "description": "\uC774 \uC5ED\uD560\uC774 \uBC1B\uB294 \uD658\uACBD \uBCC0\uC218\uC758 \uACC4\uC57D \uC2A4\uD0A4\uB9C8 \uC774\uB984" }, "process": { "$ref": "#/$defs/Process", "description": "\uCEE8\uD14C\uC774\uB108\uAC00 \uC2DC\uC791\uD558\uB294 \uC0AC\uC6A9\uC790(\uC774\uBBF8\uC9C0 USER \uC758 \uC22B\uC790). \uBC30\uCE58 \uC601\uC5ED\uC740 user \uB97C \uB36E\uC5B4\uC4F0\uC9C0 \uC54A\uB294\uB2E4" }, "files": { "type": "array", "items": { "$ref": "#/$defs/File" } }, "writable": { "type": "array", "items": { "$ref": "#/$defs/Writable" } }, "capabilities": { "type": "array", "uniqueItems": true, "items": { "enum": ["NET_BIND_SERVICE", "CHOWN", "SETUID", "SETGID", "DAC_OVERRIDE", "FOWNER", "KILL"] }, "description": "cap_drop ALL \uB4A4\uC5D0 \uB354\uD574\uC57C \uD558\uB294 \uAC83\uB9CC. \uBE44\uC5B4 \uC788\uC73C\uBA74 \uB354\uD558\uC9C0 \uC54A\uB294\uB2E4" }, "sysctls": { "type": "object", "propertyNames": { "enum": ["net.ipv4.ip_unprivileged_port_start"] }, "additionalProperties": { "type": "integer", "minimum": 0 }, "description": "\uBC30\uCE58 \uC601\uC5ED\uC774 \uC774 \uAC12\uC73C\uB85C \uC918\uC57C \uD558\uB294 \uCEE4\uB110 \uB9E4\uAC1C\uBCC0\uC218(\uC774\uB984 \uACF5\uAC04 \uC548). \uC5C6\uC73C\uBA74 \uC8FC\uC9C0 \uC54A\uB294\uB2E4. \uC608: root \uAC00 \uC544\uB2CC \uC0AC\uC6A9\uC790\uAC00 1024 \uC544\uB798 \uD3EC\uD2B8\uB97C \uC5F4 \uB54C net.ipv4.ip_unprivileged_port_start=0" }, "config_paths": { "type": "object", "description": "Job config directory paths. Resolve relative values against the config file container directory. Only these declared paths can be mounted; configuration content is validated against JobsDeclaration.config.schema first.", "propertyNames": { "type": "string", "pattern": "^/(?:[^~/]|~[01])*(?:/(?:[^~/]|~[01])*)*$", "description": "RFC 6901 JSON Pointer in the job config declared by JobsDeclaration.config." }, "additionalProperties": { "$ref": "#/$defs/ConfigPath" } } } }, "ConfigPath": { "type": "object", "additionalProperties": false, "required": ["access", "required"], "properties": { "access": { "enum": ["read", "write"], "description": "Directory bind: read-only input or writable job output. The process identity is InputSet.process." }, "required": { "type": "boolean", "description": "If false, an absent config member does not declare a mount (e.g. HTTP/memory store has no file root)." } } } }, "examples": [{ "schema_version": 1, "image": "survey-service", "read_only_root": true, "exec_absolute_argv": true, "role_env": null, "roles": { "default": { "env_schema": "SurveyServiceEnv", "process": { "uid": 10001, "gid": 10001 }, "capabilities": [], "files": [{ "path_env": "SURVEY_DB_PASSWORD_FILE", "path": "/run/secrets/survey-db-password", "kind": "secret", "schema": null, "required": true, "opened_by": "start-process" }], "writable": [{ "path": "/data", "persist": true, "written_by": { "uid": 10001, "gid": 10001 } }, { "path": "/tmp", "persist": false, "written_by": { "uid": 10001, "gid": 10001 } }], "sysctls": {} } }, "jobs": {} }] };
var pattern31 = new RegExp("^[A-Z][A-Z0-9_]*$", "u");
var schema40 = { "type": "object", "additionalProperties": false, "required": ["env_schema", "process", "files", "writable", "capabilities", "sysctls"], "properties": { "env_schema": { "type": "string", "pattern": "^[A-Z][A-Za-z0-9]*Env$", "description": "\uC774 \uC5ED\uD560\uC774 \uBC1B\uB294 \uD658\uACBD \uBCC0\uC218\uC758 \uACC4\uC57D \uC2A4\uD0A4\uB9C8 \uC774\uB984" }, "process": { "$ref": "#/$defs/Process", "description": "\uCEE8\uD14C\uC774\uB108\uAC00 \uC2DC\uC791\uD558\uB294 \uC0AC\uC6A9\uC790(\uC774\uBBF8\uC9C0 USER \uC758 \uC22B\uC790). \uBC30\uCE58 \uC601\uC5ED\uC740 user \uB97C \uB36E\uC5B4\uC4F0\uC9C0 \uC54A\uB294\uB2E4" }, "files": { "type": "array", "items": { "$ref": "#/$defs/File" } }, "writable": { "type": "array", "items": { "$ref": "#/$defs/Writable" } }, "capabilities": { "type": "array", "uniqueItems": true, "items": { "enum": ["NET_BIND_SERVICE", "CHOWN", "SETUID", "SETGID", "DAC_OVERRIDE", "FOWNER", "KILL"] }, "description": "cap_drop ALL \uB4A4\uC5D0 \uB354\uD574\uC57C \uD558\uB294 \uAC83\uB9CC. \uBE44\uC5B4 \uC788\uC73C\uBA74 \uB354\uD558\uC9C0 \uC54A\uB294\uB2E4" }, "sysctls": { "type": "object", "propertyNames": { "enum": ["net.ipv4.ip_unprivileged_port_start"] }, "additionalProperties": { "type": "integer", "minimum": 0 }, "description": "\uBC30\uCE58 \uC601\uC5ED\uC774 \uC774 \uAC12\uC73C\uB85C \uC918\uC57C \uD558\uB294 \uCEE4\uB110 \uB9E4\uAC1C\uBCC0\uC218(\uC774\uB984 \uACF5\uAC04 \uC548). \uC5C6\uC73C\uBA74 \uC8FC\uC9C0 \uC54A\uB294\uB2E4. \uC608: root \uAC00 \uC544\uB2CC \uC0AC\uC6A9\uC790\uAC00 1024 \uC544\uB798 \uD3EC\uD2B8\uB97C \uC5F4 \uB54C net.ipv4.ip_unprivileged_port_start=0" }, "config_paths": { "type": "object", "description": "Job config directory paths. Resolve relative values against the config file container directory. Only these declared paths can be mounted; configuration content is validated against JobsDeclaration.config.schema first.", "propertyNames": { "type": "string", "pattern": "^/(?:[^~/]|~[01])*(?:/(?:[^~/]|~[01])*)*$", "description": "RFC 6901 JSON Pointer in the job config declared by JobsDeclaration.config." }, "additionalProperties": { "$ref": "#/$defs/ConfigPath" } } } };
var schema42 = { "type": "object", "additionalProperties": false, "required": ["path", "kind", "required", "opened_by"], "properties": { "path_env": { "type": ["string", "null"], "pattern": "^[A-Z][A-Z0-9_]*$", "description": "\uACBD\uB85C\uB97C \uC8FC\uB294 \uD658\uACBD \uBCC0\uC218(\uC608: DB_PASSWORD_FILE). null \uC774\uBA74 path \uACE0\uC815" }, "path": { "type": "string", "pattern": "^/[^\\s]*$", "description": "path_env \uAC00 \uC5C6\uC744 \uB54C \uC774\uBBF8\uC9C0\uAC00 \uC77D\uB294 \uACBD\uB85C(path_env \uAC00 \uC788\uC73C\uBA74 \uADF8 \uAE30\uBCF8\uAC12)" }, "directory": { "type": "boolean", "default": false, "description": "\uCC38\uC774\uBA74 \uD3F4\uB354(\uADF8 \uC548\uC758 \uD30C\uC77C \uC804\uBD80\uB97C \uC77D\uB294\uB2E4)" }, "kind": { "enum": ["secret", "config", "certificate", "ca-bundle", "declaration"], "description": "secret \uC740 \uAC12\uC774 \uBE44\uBC00\uC774\uB2E4(D84): \uBC30\uCE58 \uC601\uC5ED\uC740 \uB2E4\uB978 \uC0AC\uC6A9\uC790\uAC00 \uC77D\uC9C0 \uBABB\uD558\uAC8C \uC8FC\uB418 read_by \uB294 \uC77D\uC744 \uC218 \uC788\uC5B4\uC57C \uD55C\uB2E4" }, "schema": { "type": ["string", "null"], "pattern": "^[A-Z][A-Za-z0-9]*$", "description": "\uB0B4\uC6A9\uC774 \uB530\uB974\uB294 \uACC4\uC57D \uC2A4\uD0A4\uB9C8 \uC774\uB984(\uC788\uC73C\uBA74)" }, "required": { "type": "boolean" }, "opened_by": { "const": "start-process", "description": "\uC8FC\uC785\uB41C \uD30C\uC77C\uC740 \uCEE8\uD14C\uC774\uB108\uC758 \uC2DC\uC791 \uD504\uB85C\uC138\uC2A4(process \uC758 uid, \uBC30\uCE58 \uC601\uC5ED\uC774 \uBD99\uC778 \uBCF4\uC870 \uADF8\uB8F9 \uD3EC\uD568)\uAC00 \uC5F0\uB2E4. \uBC30\uCE58 \uC601\uC5ED\uC740 \uD30C\uC77C\uC744 0640\xB7\uADF8\uB8F9 SECRETS_GID \uB85C \uB450\uACE0 \uADF8 \uADF8\uB8F9\uC744 \uBCF4\uC870 \uADF8\uB8F9\uC73C\uB85C \uBD99\uC778\uB2E4. \uC0AC\uC6A9\uC790\uB97C \uBC14\uAFBC(gosu\xB7setpriv) \uB4A4\uC5D0\uB294 \uBCF4\uC870 \uADF8\uB8F9\uC774 \uC0AC\uB77C\uC9C0\uBBC0\uB85C \uADF8 \uC804\uC5D0 \uC5F4\uAC70\uB098 \uC2DC\uC791 \uD504\uB85C\uC138\uC2A4\uAC00 \uC790\uAE30 \uC0AC\uBCF8\uC744 \uB9CC\uB4E4\uC5B4 \uB118\uAE34\uB2E4(2026-11-06 DB \uBE44\uBC00 \uC77D\uAE30 \uC2E4\uD328\uC758 \uC6D0\uC778)" } } };
var schema45 = { "type": "object", "additionalProperties": false, "required": ["access", "required"], "properties": { "access": { "enum": ["read", "write"], "description": "Directory bind: read-only input or writable job output. The process identity is InputSet.process." }, "required": { "type": "boolean", "description": "If false, an absent config member does not declare a mount (e.g. HTTP/memory store has no file root)." } } };
var pattern33 = new RegExp("^[A-Z][A-Za-z0-9]*Env$", "u");
var pattern35 = new RegExp("^/[^\\s]*$", "u");
var pattern36 = new RegExp("^[A-Z][A-Za-z0-9]*$", "u");
var pattern38 = new RegExp("^/(?:[^~/]|~[01])*(?:/(?:[^~/]|~[01])*)*$", "u");
function validate29(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate29.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.path === void 0) {
      const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "path" }, message: "must have required property 'path'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.persist === void 0) {
      const err1 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "persist" }, message: "must have required property 'persist'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.written_by === void 0) {
      const err2 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "written_by" }, message: "must have required property 'written_by'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    for (const key0 in data) {
      if (!(key0 === "path" || key0 === "persist" || key0 === "written_by")) {
        const err3 = { instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
        if (vErrors === null) {
          vErrors = [err3];
        } else {
          vErrors.push(err3);
        }
        errors++;
      }
    }
    if (data.path !== void 0) {
      let data0 = data.path;
      if (typeof data0 === "string") {
        if (!pattern35.test(data0)) {
          const err4 = { instancePath: instancePath + "/path", schemaPath: "#/properties/path/pattern", keyword: "pattern", params: { pattern: "^/[^\\s]*$" }, message: 'must match pattern "^/[^\\s]*$"' };
          if (vErrors === null) {
            vErrors = [err4];
          } else {
            vErrors.push(err4);
          }
          errors++;
        }
      } else {
        const err5 = { instancePath: instancePath + "/path", schemaPath: "#/properties/path/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      }
    }
    if (data.persist !== void 0) {
      if (typeof data.persist !== "boolean") {
        const err6 = { instancePath: instancePath + "/persist", schemaPath: "#/properties/persist/type", keyword: "type", params: { type: "boolean" }, message: "must be boolean" };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
    if (data.written_by !== void 0) {
      let data2 = data.written_by;
      if (data2 && typeof data2 == "object" && !Array.isArray(data2)) {
        if (data2.uid === void 0) {
          const err7 = { instancePath: instancePath + "/written_by", schemaPath: "#/$defs/Process/required", keyword: "required", params: { missingProperty: "uid" }, message: "must have required property 'uid'" };
          if (vErrors === null) {
            vErrors = [err7];
          } else {
            vErrors.push(err7);
          }
          errors++;
        }
        if (data2.gid === void 0) {
          const err8 = { instancePath: instancePath + "/written_by", schemaPath: "#/$defs/Process/required", keyword: "required", params: { missingProperty: "gid" }, message: "must have required property 'gid'" };
          if (vErrors === null) {
            vErrors = [err8];
          } else {
            vErrors.push(err8);
          }
          errors++;
        }
        for (const key1 in data2) {
          if (!(key1 === "uid" || key1 === "gid")) {
            const err9 = { instancePath: instancePath + "/written_by", schemaPath: "#/$defs/Process/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key1 }, message: "must NOT have additional properties" };
            if (vErrors === null) {
              vErrors = [err9];
            } else {
              vErrors.push(err9);
            }
            errors++;
          }
        }
        if (data2.uid !== void 0) {
          let data3 = data2.uid;
          if (!(typeof data3 == "number" && (!(data3 % 1) && !isNaN(data3)))) {
            const err10 = { instancePath: instancePath + "/written_by/uid", schemaPath: "#/$defs/Process/properties/uid/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
            if (vErrors === null) {
              vErrors = [err10];
            } else {
              vErrors.push(err10);
            }
            errors++;
          }
          if (typeof data3 == "number") {
            if (data3 > 2147483647 || isNaN(data3)) {
              const err11 = { instancePath: instancePath + "/written_by/uid", schemaPath: "#/$defs/Process/properties/uid/maximum", keyword: "maximum", params: { comparison: "<=", limit: 2147483647 }, message: "must be <= 2147483647" };
              if (vErrors === null) {
                vErrors = [err11];
              } else {
                vErrors.push(err11);
              }
              errors++;
            }
            if (data3 < 0 || isNaN(data3)) {
              const err12 = { instancePath: instancePath + "/written_by/uid", schemaPath: "#/$defs/Process/properties/uid/minimum", keyword: "minimum", params: { comparison: ">=", limit: 0 }, message: "must be >= 0" };
              if (vErrors === null) {
                vErrors = [err12];
              } else {
                vErrors.push(err12);
              }
              errors++;
            }
          }
        }
        if (data2.gid !== void 0) {
          let data4 = data2.gid;
          if (!(typeof data4 == "number" && (!(data4 % 1) && !isNaN(data4)))) {
            const err13 = { instancePath: instancePath + "/written_by/gid", schemaPath: "#/$defs/Process/properties/gid/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
            if (vErrors === null) {
              vErrors = [err13];
            } else {
              vErrors.push(err13);
            }
            errors++;
          }
          if (typeof data4 == "number") {
            if (data4 > 2147483647 || isNaN(data4)) {
              const err14 = { instancePath: instancePath + "/written_by/gid", schemaPath: "#/$defs/Process/properties/gid/maximum", keyword: "maximum", params: { comparison: "<=", limit: 2147483647 }, message: "must be <= 2147483647" };
              if (vErrors === null) {
                vErrors = [err14];
              } else {
                vErrors.push(err14);
              }
              errors++;
            }
            if (data4 < 0 || isNaN(data4)) {
              const err15 = { instancePath: instancePath + "/written_by/gid", schemaPath: "#/$defs/Process/properties/gid/minimum", keyword: "minimum", params: { comparison: ">=", limit: 0 }, message: "must be >= 0" };
              if (vErrors === null) {
                vErrors = [err15];
              } else {
                vErrors.push(err15);
              }
              errors++;
            }
          }
        }
      } else {
        const err16 = { instancePath: instancePath + "/written_by", schemaPath: "#/$defs/Process/type", keyword: "type", params: { type: "object" }, message: "must be object" };
        if (vErrors === null) {
          vErrors = [err16];
        } else {
          vErrors.push(err16);
        }
        errors++;
      }
    }
  } else {
    const err17 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err17];
    } else {
      vErrors.push(err17);
    }
    errors++;
  }
  validate29.errors = vErrors;
  return errors === 0;
}
validate29.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
function validate28(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate28.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.env_schema === void 0) {
      const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "env_schema" }, message: "must have required property 'env_schema'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.process === void 0) {
      const err1 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "process" }, message: "must have required property 'process'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.files === void 0) {
      const err2 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "files" }, message: "must have required property 'files'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.writable === void 0) {
      const err3 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "writable" }, message: "must have required property 'writable'" };
      if (vErrors === null) {
        vErrors = [err3];
      } else {
        vErrors.push(err3);
      }
      errors++;
    }
    if (data.capabilities === void 0) {
      const err4 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "capabilities" }, message: "must have required property 'capabilities'" };
      if (vErrors === null) {
        vErrors = [err4];
      } else {
        vErrors.push(err4);
      }
      errors++;
    }
    if (data.sysctls === void 0) {
      const err5 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "sysctls" }, message: "must have required property 'sysctls'" };
      if (vErrors === null) {
        vErrors = [err5];
      } else {
        vErrors.push(err5);
      }
      errors++;
    }
    for (const key0 in data) {
      if (!(key0 === "env_schema" || key0 === "process" || key0 === "files" || key0 === "writable" || key0 === "capabilities" || key0 === "sysctls" || key0 === "config_paths")) {
        const err6 = { instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
    if (data.env_schema !== void 0) {
      let data0 = data.env_schema;
      if (typeof data0 === "string") {
        if (!pattern33.test(data0)) {
          const err7 = { instancePath: instancePath + "/env_schema", schemaPath: "#/properties/env_schema/pattern", keyword: "pattern", params: { pattern: "^[A-Z][A-Za-z0-9]*Env$" }, message: 'must match pattern "^[A-Z][A-Za-z0-9]*Env$"' };
          if (vErrors === null) {
            vErrors = [err7];
          } else {
            vErrors.push(err7);
          }
          errors++;
        }
      } else {
        const err8 = { instancePath: instancePath + "/env_schema", schemaPath: "#/properties/env_schema/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err8];
        } else {
          vErrors.push(err8);
        }
        errors++;
      }
    }
    if (data.process !== void 0) {
      let data1 = data.process;
      if (data1 && typeof data1 == "object" && !Array.isArray(data1)) {
        if (data1.uid === void 0) {
          const err9 = { instancePath: instancePath + "/process", schemaPath: "#/$defs/Process/required", keyword: "required", params: { missingProperty: "uid" }, message: "must have required property 'uid'" };
          if (vErrors === null) {
            vErrors = [err9];
          } else {
            vErrors.push(err9);
          }
          errors++;
        }
        if (data1.gid === void 0) {
          const err10 = { instancePath: instancePath + "/process", schemaPath: "#/$defs/Process/required", keyword: "required", params: { missingProperty: "gid" }, message: "must have required property 'gid'" };
          if (vErrors === null) {
            vErrors = [err10];
          } else {
            vErrors.push(err10);
          }
          errors++;
        }
        for (const key1 in data1) {
          if (!(key1 === "uid" || key1 === "gid")) {
            const err11 = { instancePath: instancePath + "/process", schemaPath: "#/$defs/Process/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key1 }, message: "must NOT have additional properties" };
            if (vErrors === null) {
              vErrors = [err11];
            } else {
              vErrors.push(err11);
            }
            errors++;
          }
        }
        if (data1.uid !== void 0) {
          let data2 = data1.uid;
          if (!(typeof data2 == "number" && (!(data2 % 1) && !isNaN(data2)))) {
            const err12 = { instancePath: instancePath + "/process/uid", schemaPath: "#/$defs/Process/properties/uid/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
            if (vErrors === null) {
              vErrors = [err12];
            } else {
              vErrors.push(err12);
            }
            errors++;
          }
          if (typeof data2 == "number") {
            if (data2 > 2147483647 || isNaN(data2)) {
              const err13 = { instancePath: instancePath + "/process/uid", schemaPath: "#/$defs/Process/properties/uid/maximum", keyword: "maximum", params: { comparison: "<=", limit: 2147483647 }, message: "must be <= 2147483647" };
              if (vErrors === null) {
                vErrors = [err13];
              } else {
                vErrors.push(err13);
              }
              errors++;
            }
            if (data2 < 0 || isNaN(data2)) {
              const err14 = { instancePath: instancePath + "/process/uid", schemaPath: "#/$defs/Process/properties/uid/minimum", keyword: "minimum", params: { comparison: ">=", limit: 0 }, message: "must be >= 0" };
              if (vErrors === null) {
                vErrors = [err14];
              } else {
                vErrors.push(err14);
              }
              errors++;
            }
          }
        }
        if (data1.gid !== void 0) {
          let data3 = data1.gid;
          if (!(typeof data3 == "number" && (!(data3 % 1) && !isNaN(data3)))) {
            const err15 = { instancePath: instancePath + "/process/gid", schemaPath: "#/$defs/Process/properties/gid/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
            if (vErrors === null) {
              vErrors = [err15];
            } else {
              vErrors.push(err15);
            }
            errors++;
          }
          if (typeof data3 == "number") {
            if (data3 > 2147483647 || isNaN(data3)) {
              const err16 = { instancePath: instancePath + "/process/gid", schemaPath: "#/$defs/Process/properties/gid/maximum", keyword: "maximum", params: { comparison: "<=", limit: 2147483647 }, message: "must be <= 2147483647" };
              if (vErrors === null) {
                vErrors = [err16];
              } else {
                vErrors.push(err16);
              }
              errors++;
            }
            if (data3 < 0 || isNaN(data3)) {
              const err17 = { instancePath: instancePath + "/process/gid", schemaPath: "#/$defs/Process/properties/gid/minimum", keyword: "minimum", params: { comparison: ">=", limit: 0 }, message: "must be >= 0" };
              if (vErrors === null) {
                vErrors = [err17];
              } else {
                vErrors.push(err17);
              }
              errors++;
            }
          }
        }
      } else {
        const err18 = { instancePath: instancePath + "/process", schemaPath: "#/$defs/Process/type", keyword: "type", params: { type: "object" }, message: "must be object" };
        if (vErrors === null) {
          vErrors = [err18];
        } else {
          vErrors.push(err18);
        }
        errors++;
      }
    }
    if (data.files !== void 0) {
      let data4 = data.files;
      if (Array.isArray(data4)) {
        const len0 = data4.length;
        for (let i0 = 0; i0 < len0; i0++) {
          let data5 = data4[i0];
          if (data5 && typeof data5 == "object" && !Array.isArray(data5)) {
            if (data5.path === void 0) {
              const err19 = { instancePath: instancePath + "/files/" + i0, schemaPath: "#/$defs/File/required", keyword: "required", params: { missingProperty: "path" }, message: "must have required property 'path'" };
              if (vErrors === null) {
                vErrors = [err19];
              } else {
                vErrors.push(err19);
              }
              errors++;
            }
            if (data5.kind === void 0) {
              const err20 = { instancePath: instancePath + "/files/" + i0, schemaPath: "#/$defs/File/required", keyword: "required", params: { missingProperty: "kind" }, message: "must have required property 'kind'" };
              if (vErrors === null) {
                vErrors = [err20];
              } else {
                vErrors.push(err20);
              }
              errors++;
            }
            if (data5.required === void 0) {
              const err21 = { instancePath: instancePath + "/files/" + i0, schemaPath: "#/$defs/File/required", keyword: "required", params: { missingProperty: "required" }, message: "must have required property 'required'" };
              if (vErrors === null) {
                vErrors = [err21];
              } else {
                vErrors.push(err21);
              }
              errors++;
            }
            if (data5.opened_by === void 0) {
              const err22 = { instancePath: instancePath + "/files/" + i0, schemaPath: "#/$defs/File/required", keyword: "required", params: { missingProperty: "opened_by" }, message: "must have required property 'opened_by'" };
              if (vErrors === null) {
                vErrors = [err22];
              } else {
                vErrors.push(err22);
              }
              errors++;
            }
            for (const key2 in data5) {
              if (!(key2 === "path_env" || key2 === "path" || key2 === "directory" || key2 === "kind" || key2 === "schema" || key2 === "required" || key2 === "opened_by")) {
                const err23 = { instancePath: instancePath + "/files/" + i0, schemaPath: "#/$defs/File/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key2 }, message: "must NOT have additional properties" };
                if (vErrors === null) {
                  vErrors = [err23];
                } else {
                  vErrors.push(err23);
                }
                errors++;
              }
            }
            if (data5.path_env !== void 0) {
              let data6 = data5.path_env;
              if (typeof data6 !== "string" && data6 !== null) {
                const err24 = { instancePath: instancePath + "/files/" + i0 + "/path_env", schemaPath: "#/$defs/File/properties/path_env/type", keyword: "type", params: { type: schema42.properties.path_env.type }, message: "must be string,null" };
                if (vErrors === null) {
                  vErrors = [err24];
                } else {
                  vErrors.push(err24);
                }
                errors++;
              }
              if (typeof data6 === "string") {
                if (!pattern31.test(data6)) {
                  const err25 = { instancePath: instancePath + "/files/" + i0 + "/path_env", schemaPath: "#/$defs/File/properties/path_env/pattern", keyword: "pattern", params: { pattern: "^[A-Z][A-Z0-9_]*$" }, message: 'must match pattern "^[A-Z][A-Z0-9_]*$"' };
                  if (vErrors === null) {
                    vErrors = [err25];
                  } else {
                    vErrors.push(err25);
                  }
                  errors++;
                }
              }
            }
            if (data5.path !== void 0) {
              let data7 = data5.path;
              if (typeof data7 === "string") {
                if (!pattern35.test(data7)) {
                  const err26 = { instancePath: instancePath + "/files/" + i0 + "/path", schemaPath: "#/$defs/File/properties/path/pattern", keyword: "pattern", params: { pattern: "^/[^\\s]*$" }, message: 'must match pattern "^/[^\\s]*$"' };
                  if (vErrors === null) {
                    vErrors = [err26];
                  } else {
                    vErrors.push(err26);
                  }
                  errors++;
                }
              } else {
                const err27 = { instancePath: instancePath + "/files/" + i0 + "/path", schemaPath: "#/$defs/File/properties/path/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                if (vErrors === null) {
                  vErrors = [err27];
                } else {
                  vErrors.push(err27);
                }
                errors++;
              }
            }
            if (data5.directory !== void 0) {
              if (typeof data5.directory !== "boolean") {
                const err28 = { instancePath: instancePath + "/files/" + i0 + "/directory", schemaPath: "#/$defs/File/properties/directory/type", keyword: "type", params: { type: "boolean" }, message: "must be boolean" };
                if (vErrors === null) {
                  vErrors = [err28];
                } else {
                  vErrors.push(err28);
                }
                errors++;
              }
            }
            if (data5.kind !== void 0) {
              let data9 = data5.kind;
              if (!(data9 === "secret" || data9 === "config" || data9 === "certificate" || data9 === "ca-bundle" || data9 === "declaration")) {
                const err29 = { instancePath: instancePath + "/files/" + i0 + "/kind", schemaPath: "#/$defs/File/properties/kind/enum", keyword: "enum", params: { allowedValues: schema42.properties.kind.enum }, message: "must be equal to one of the allowed values" };
                if (vErrors === null) {
                  vErrors = [err29];
                } else {
                  vErrors.push(err29);
                }
                errors++;
              }
            }
            if (data5.schema !== void 0) {
              let data10 = data5.schema;
              if (typeof data10 !== "string" && data10 !== null) {
                const err30 = { instancePath: instancePath + "/files/" + i0 + "/schema", schemaPath: "#/$defs/File/properties/schema/type", keyword: "type", params: { type: schema42.properties.schema.type }, message: "must be string,null" };
                if (vErrors === null) {
                  vErrors = [err30];
                } else {
                  vErrors.push(err30);
                }
                errors++;
              }
              if (typeof data10 === "string") {
                if (!pattern36.test(data10)) {
                  const err31 = { instancePath: instancePath + "/files/" + i0 + "/schema", schemaPath: "#/$defs/File/properties/schema/pattern", keyword: "pattern", params: { pattern: "^[A-Z][A-Za-z0-9]*$" }, message: 'must match pattern "^[A-Z][A-Za-z0-9]*$"' };
                  if (vErrors === null) {
                    vErrors = [err31];
                  } else {
                    vErrors.push(err31);
                  }
                  errors++;
                }
              }
            }
            if (data5.required !== void 0) {
              if (typeof data5.required !== "boolean") {
                const err32 = { instancePath: instancePath + "/files/" + i0 + "/required", schemaPath: "#/$defs/File/properties/required/type", keyword: "type", params: { type: "boolean" }, message: "must be boolean" };
                if (vErrors === null) {
                  vErrors = [err32];
                } else {
                  vErrors.push(err32);
                }
                errors++;
              }
            }
            if (data5.opened_by !== void 0) {
              if ("start-process" !== data5.opened_by) {
                const err33 = { instancePath: instancePath + "/files/" + i0 + "/opened_by", schemaPath: "#/$defs/File/properties/opened_by/const", keyword: "const", params: { allowedValue: "start-process" }, message: "must be equal to constant" };
                if (vErrors === null) {
                  vErrors = [err33];
                } else {
                  vErrors.push(err33);
                }
                errors++;
              }
            }
          } else {
            const err34 = { instancePath: instancePath + "/files/" + i0, schemaPath: "#/$defs/File/type", keyword: "type", params: { type: "object" }, message: "must be object" };
            if (vErrors === null) {
              vErrors = [err34];
            } else {
              vErrors.push(err34);
            }
            errors++;
          }
        }
      } else {
        const err35 = { instancePath: instancePath + "/files", schemaPath: "#/properties/files/type", keyword: "type", params: { type: "array" }, message: "must be array" };
        if (vErrors === null) {
          vErrors = [err35];
        } else {
          vErrors.push(err35);
        }
        errors++;
      }
    }
    if (data.writable !== void 0) {
      let data13 = data.writable;
      if (Array.isArray(data13)) {
        const len1 = data13.length;
        for (let i1 = 0; i1 < len1; i1++) {
          if (!validate29(data13[i1], { instancePath: instancePath + "/writable/" + i1, parentData: data13, parentDataProperty: i1, rootData, dynamicAnchors })) {
            vErrors = vErrors === null ? validate29.errors : vErrors.concat(validate29.errors);
            errors = vErrors.length;
          }
        }
      } else {
        const err36 = { instancePath: instancePath + "/writable", schemaPath: "#/properties/writable/type", keyword: "type", params: { type: "array" }, message: "must be array" };
        if (vErrors === null) {
          vErrors = [err36];
        } else {
          vErrors.push(err36);
        }
        errors++;
      }
    }
    if (data.capabilities !== void 0) {
      let data15 = data.capabilities;
      if (Array.isArray(data15)) {
        const len2 = data15.length;
        for (let i2 = 0; i2 < len2; i2++) {
          let data16 = data15[i2];
          if (!(data16 === "NET_BIND_SERVICE" || data16 === "CHOWN" || data16 === "SETUID" || data16 === "SETGID" || data16 === "DAC_OVERRIDE" || data16 === "FOWNER" || data16 === "KILL")) {
            const err37 = { instancePath: instancePath + "/capabilities/" + i2, schemaPath: "#/properties/capabilities/items/enum", keyword: "enum", params: { allowedValues: schema40.properties.capabilities.items.enum }, message: "must be equal to one of the allowed values" };
            if (vErrors === null) {
              vErrors = [err37];
            } else {
              vErrors.push(err37);
            }
            errors++;
          }
        }
        let i3 = data15.length;
        let j0;
        if (i3 > 1) {
          outer0: for (; i3--; ) {
            for (j0 = i3; j0--; ) {
              if (func0(data15[i3], data15[j0])) {
                const err38 = { instancePath: instancePath + "/capabilities", schemaPath: "#/properties/capabilities/uniqueItems", keyword: "uniqueItems", params: { i: i3, j: j0 }, message: "must NOT have duplicate items (items ## " + j0 + " and " + i3 + " are identical)" };
                if (vErrors === null) {
                  vErrors = [err38];
                } else {
                  vErrors.push(err38);
                }
                errors++;
                break outer0;
              }
            }
          }
        }
      } else {
        const err39 = { instancePath: instancePath + "/capabilities", schemaPath: "#/properties/capabilities/type", keyword: "type", params: { type: "array" }, message: "must be array" };
        if (vErrors === null) {
          vErrors = [err39];
        } else {
          vErrors.push(err39);
        }
        errors++;
      }
    }
    if (data.sysctls !== void 0) {
      let data17 = data.sysctls;
      if (data17 && typeof data17 == "object" && !Array.isArray(data17)) {
        for (const key3 in data17) {
          const _errs38 = errors;
          if (!(key3 === "net.ipv4.ip_unprivileged_port_start")) {
            const err40 = { instancePath: instancePath + "/sysctls", schemaPath: "#/properties/sysctls/propertyNames/enum", keyword: "enum", params: { allowedValues: schema40.properties.sysctls.propertyNames.enum }, message: "must be equal to one of the allowed values", propertyName: key3 };
            if (vErrors === null) {
              vErrors = [err40];
            } else {
              vErrors.push(err40);
            }
            errors++;
          }
          var valid12 = _errs38 === errors;
          if (!valid12) {
            const err41 = { instancePath: instancePath + "/sysctls", schemaPath: "#/properties/sysctls/propertyNames", keyword: "propertyNames", params: { propertyName: key3 }, message: "property name must be valid" };
            if (vErrors === null) {
              vErrors = [err41];
            } else {
              vErrors.push(err41);
            }
            errors++;
          }
        }
        for (const key4 in data17) {
          let data18 = data17[key4];
          if (!(typeof data18 == "number" && (!(data18 % 1) && !isNaN(data18)))) {
            const err42 = { instancePath: instancePath + "/sysctls/" + key4.replace(/~/g, "~0").replace(/\//g, "~1"), schemaPath: "#/properties/sysctls/additionalProperties/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
            if (vErrors === null) {
              vErrors = [err42];
            } else {
              vErrors.push(err42);
            }
            errors++;
          }
          if (typeof data18 == "number") {
            if (data18 < 0 || isNaN(data18)) {
              const err43 = { instancePath: instancePath + "/sysctls/" + key4.replace(/~/g, "~0").replace(/\//g, "~1"), schemaPath: "#/properties/sysctls/additionalProperties/minimum", keyword: "minimum", params: { comparison: ">=", limit: 0 }, message: "must be >= 0" };
              if (vErrors === null) {
                vErrors = [err43];
              } else {
                vErrors.push(err43);
              }
              errors++;
            }
          }
        }
      } else {
        const err44 = { instancePath: instancePath + "/sysctls", schemaPath: "#/properties/sysctls/type", keyword: "type", params: { type: "object" }, message: "must be object" };
        if (vErrors === null) {
          vErrors = [err44];
        } else {
          vErrors.push(err44);
        }
        errors++;
      }
    }
    if (data.config_paths !== void 0) {
      let data19 = data.config_paths;
      if (data19 && typeof data19 == "object" && !Array.isArray(data19)) {
        for (const key5 in data19) {
          const _errs44 = errors;
          if (typeof key5 === "string") {
            if (!pattern38.test(key5)) {
              const err45 = { instancePath: instancePath + "/config_paths", schemaPath: "#/properties/config_paths/propertyNames/pattern", keyword: "pattern", params: { pattern: "^/(?:[^~/]|~[01])*(?:/(?:[^~/]|~[01])*)*$" }, message: 'must match pattern "^/(?:[^~/]|~[01])*(?:/(?:[^~/]|~[01])*)*$"', propertyName: key5 };
              if (vErrors === null) {
                vErrors = [err45];
              } else {
                vErrors.push(err45);
              }
              errors++;
            }
          } else {
            const err46 = { instancePath: instancePath + "/config_paths", schemaPath: "#/properties/config_paths/propertyNames/type", keyword: "type", params: { type: "string" }, message: "must be string", propertyName: key5 };
            if (vErrors === null) {
              vErrors = [err46];
            } else {
              vErrors.push(err46);
            }
            errors++;
          }
          var valid14 = _errs44 === errors;
          if (!valid14) {
            const err47 = { instancePath: instancePath + "/config_paths", schemaPath: "#/properties/config_paths/propertyNames", keyword: "propertyNames", params: { propertyName: key5 }, message: "property name must be valid" };
            if (vErrors === null) {
              vErrors = [err47];
            } else {
              vErrors.push(err47);
            }
            errors++;
          }
        }
        for (const key6 in data19) {
          let data20 = data19[key6];
          if (data20 && typeof data20 == "object" && !Array.isArray(data20)) {
            if (data20.access === void 0) {
              const err48 = { instancePath: instancePath + "/config_paths/" + key6.replace(/~/g, "~0").replace(/\//g, "~1"), schemaPath: "#/$defs/ConfigPath/required", keyword: "required", params: { missingProperty: "access" }, message: "must have required property 'access'" };
              if (vErrors === null) {
                vErrors = [err48];
              } else {
                vErrors.push(err48);
              }
              errors++;
            }
            if (data20.required === void 0) {
              const err49 = { instancePath: instancePath + "/config_paths/" + key6.replace(/~/g, "~0").replace(/\//g, "~1"), schemaPath: "#/$defs/ConfigPath/required", keyword: "required", params: { missingProperty: "required" }, message: "must have required property 'required'" };
              if (vErrors === null) {
                vErrors = [err49];
              } else {
                vErrors.push(err49);
              }
              errors++;
            }
            for (const key7 in data20) {
              if (!(key7 === "access" || key7 === "required")) {
                const err50 = { instancePath: instancePath + "/config_paths/" + key6.replace(/~/g, "~0").replace(/\//g, "~1"), schemaPath: "#/$defs/ConfigPath/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key7 }, message: "must NOT have additional properties" };
                if (vErrors === null) {
                  vErrors = [err50];
                } else {
                  vErrors.push(err50);
                }
                errors++;
              }
            }
            if (data20.access !== void 0) {
              let data21 = data20.access;
              if (!(data21 === "read" || data21 === "write")) {
                const err51 = { instancePath: instancePath + "/config_paths/" + key6.replace(/~/g, "~0").replace(/\//g, "~1") + "/access", schemaPath: "#/$defs/ConfigPath/properties/access/enum", keyword: "enum", params: { allowedValues: schema45.properties.access.enum }, message: "must be equal to one of the allowed values" };
                if (vErrors === null) {
                  vErrors = [err51];
                } else {
                  vErrors.push(err51);
                }
                errors++;
              }
            }
            if (data20.required !== void 0) {
              if (typeof data20.required !== "boolean") {
                const err52 = { instancePath: instancePath + "/config_paths/" + key6.replace(/~/g, "~0").replace(/\//g, "~1") + "/required", schemaPath: "#/$defs/ConfigPath/properties/required/type", keyword: "type", params: { type: "boolean" }, message: "must be boolean" };
                if (vErrors === null) {
                  vErrors = [err52];
                } else {
                  vErrors.push(err52);
                }
                errors++;
              }
            }
          } else {
            const err53 = { instancePath: instancePath + "/config_paths/" + key6.replace(/~/g, "~0").replace(/\//g, "~1"), schemaPath: "#/$defs/ConfigPath/type", keyword: "type", params: { type: "object" }, message: "must be object" };
            if (vErrors === null) {
              vErrors = [err53];
            } else {
              vErrors.push(err53);
            }
            errors++;
          }
        }
      } else {
        const err54 = { instancePath: instancePath + "/config_paths", schemaPath: "#/properties/config_paths/type", keyword: "type", params: { type: "object" }, message: "must be object" };
        if (vErrors === null) {
          vErrors = [err54];
        } else {
          vErrors.push(err54);
        }
        errors++;
      }
    }
  } else {
    const err55 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err55];
    } else {
      vErrors.push(err55);
    }
    errors++;
  }
  validate28.errors = vErrors;
  return errors === 0;
}
validate28.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
function validate27(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  ;
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate27.evaluated;
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
    if (data.role_env !== void 0) {
      if (data.role_env !== null) {
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
    const _errs6 = errors;
    if (data && typeof data == "object" && !Array.isArray(data)) {
      if (data.roles !== void 0) {
        let data1 = data.roles;
        if (data1 && typeof data1 == "object" && !Array.isArray(data1)) {
          if (Object.keys(data1).length > 1) {
            const err1 = { instancePath: instancePath + "/roles", schemaPath: "#/allOf/0/then/properties/roles/maxProperties", keyword: "maxProperties", params: { limit: 1 }, message: "must NOT have more than 1 properties" };
            if (vErrors === null) {
              vErrors = [err1];
            } else {
              vErrors.push(err1);
            }
            errors++;
          }
          if (data1.default === void 0) {
            const err2 = { instancePath: instancePath + "/roles", schemaPath: "#/allOf/0/then/properties/roles/required", keyword: "required", params: { missingProperty: "default" }, message: "must have required property 'default'" };
            if (vErrors === null) {
              vErrors = [err2];
            } else {
              vErrors.push(err2);
            }
            errors++;
          }
        }
      }
    }
    var _valid0 = _errs6 === errors;
    valid1 = _valid0;
    if (valid1) {
      var props0 = {};
      props0.roles = true;
      props0.role_env = true;
    }
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
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.schema_version === void 0) {
      const err4 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "schema_version" }, message: "must have required property 'schema_version'" };
      if (vErrors === null) {
        vErrors = [err4];
      } else {
        vErrors.push(err4);
      }
      errors++;
    }
    if (data.image === void 0) {
      const err5 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "image" }, message: "must have required property 'image'" };
      if (vErrors === null) {
        vErrors = [err5];
      } else {
        vErrors.push(err5);
      }
      errors++;
    }
    if (data.read_only_root === void 0) {
      const err6 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "read_only_root" }, message: "must have required property 'read_only_root'" };
      if (vErrors === null) {
        vErrors = [err6];
      } else {
        vErrors.push(err6);
      }
      errors++;
    }
    if (data.exec_absolute_argv === void 0) {
      const err7 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "exec_absolute_argv" }, message: "must have required property 'exec_absolute_argv'" };
      if (vErrors === null) {
        vErrors = [err7];
      } else {
        vErrors.push(err7);
      }
      errors++;
    }
    if (data.role_env === void 0) {
      const err8 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "role_env" }, message: "must have required property 'role_env'" };
      if (vErrors === null) {
        vErrors = [err8];
      } else {
        vErrors.push(err8);
      }
      errors++;
    }
    if (data.roles === void 0) {
      const err9 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "roles" }, message: "must have required property 'roles'" };
      if (vErrors === null) {
        vErrors = [err9];
      } else {
        vErrors.push(err9);
      }
      errors++;
    }
    if (data.jobs === void 0) {
      const err10 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "jobs" }, message: "must have required property 'jobs'" };
      if (vErrors === null) {
        vErrors = [err10];
      } else {
        vErrors.push(err10);
      }
      errors++;
    }
    for (const key0 in data) {
      if (!(key0 === "schema_version" || key0 === "image" || key0 === "read_only_root" || key0 === "exec_absolute_argv" || key0 === "role_env" || key0 === "roles" || key0 === "jobs")) {
        const err11 = { instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
        if (vErrors === null) {
          vErrors = [err11];
        } else {
          vErrors.push(err11);
        }
        errors++;
      }
    }
    if (data.schema_version !== void 0) {
      if (1 !== data.schema_version) {
        const err12 = { instancePath: instancePath + "/schema_version", schemaPath: "#/properties/schema_version/const", keyword: "const", params: { allowedValue: 1 }, message: "must be equal to constant" };
        if (vErrors === null) {
          vErrors = [err12];
        } else {
          vErrors.push(err12);
        }
        errors++;
      }
    }
    if (data.image !== void 0) {
      let data3 = data.image;
      if (typeof data3 === "string") {
        if (!pattern17.test(data3)) {
          const err13 = { instancePath: instancePath + "/image", schemaPath: "#/properties/image/pattern", keyword: "pattern", params: { pattern: "^[a-z][a-z0-9-]*$" }, message: 'must match pattern "^[a-z][a-z0-9-]*$"' };
          if (vErrors === null) {
            vErrors = [err13];
          } else {
            vErrors.push(err13);
          }
          errors++;
        }
      } else {
        const err14 = { instancePath: instancePath + "/image", schemaPath: "#/properties/image/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err14];
        } else {
          vErrors.push(err14);
        }
        errors++;
      }
    }
    if (data.read_only_root !== void 0) {
      if (true !== data.read_only_root) {
        const err15 = { instancePath: instancePath + "/read_only_root", schemaPath: "#/properties/read_only_root/const", keyword: "const", params: { allowedValue: true }, message: "must be equal to constant" };
        if (vErrors === null) {
          vErrors = [err15];
        } else {
          vErrors.push(err15);
        }
        errors++;
      }
    }
    if (data.exec_absolute_argv !== void 0) {
      if (true !== data.exec_absolute_argv) {
        const err16 = { instancePath: instancePath + "/exec_absolute_argv", schemaPath: "#/properties/exec_absolute_argv/const", keyword: "const", params: { allowedValue: true }, message: "must be equal to constant" };
        if (vErrors === null) {
          vErrors = [err16];
        } else {
          vErrors.push(err16);
        }
        errors++;
      }
    }
    if (data.role_env !== void 0) {
      let data6 = data.role_env;
      if (typeof data6 !== "string" && data6 !== null) {
        const err17 = { instancePath: instancePath + "/role_env", schemaPath: "#/properties/role_env/type", keyword: "type", params: { type: schema39.properties.role_env.type }, message: "must be string,null" };
        if (vErrors === null) {
          vErrors = [err17];
        } else {
          vErrors.push(err17);
        }
        errors++;
      }
      if (typeof data6 === "string") {
        if (!pattern31.test(data6)) {
          const err18 = { instancePath: instancePath + "/role_env", schemaPath: "#/properties/role_env/pattern", keyword: "pattern", params: { pattern: "^[A-Z][A-Z0-9_]*$" }, message: 'must match pattern "^[A-Z][A-Z0-9_]*$"' };
          if (vErrors === null) {
            vErrors = [err18];
          } else {
            vErrors.push(err18);
          }
          errors++;
        }
      }
    }
    if (data.roles !== void 0) {
      let data7 = data.roles;
      if (data7 && typeof data7 == "object" && !Array.isArray(data7)) {
        if (Object.keys(data7).length < 1) {
          const err19 = { instancePath: instancePath + "/roles", schemaPath: "#/properties/roles/minProperties", keyword: "minProperties", params: { limit: 1 }, message: "must NOT have fewer than 1 properties" };
          if (vErrors === null) {
            vErrors = [err19];
          } else {
            vErrors.push(err19);
          }
          errors++;
        }
        for (const key1 in data7) {
          const _errs18 = errors;
          if (typeof key1 === "string") {
            if (!pattern17.test(key1)) {
              const err20 = { instancePath: instancePath + "/roles", schemaPath: "#/properties/roles/propertyNames/pattern", keyword: "pattern", params: { pattern: "^[a-z][a-z0-9-]*$" }, message: 'must match pattern "^[a-z][a-z0-9-]*$"', propertyName: key1 };
              if (vErrors === null) {
                vErrors = [err20];
              } else {
                vErrors.push(err20);
              }
              errors++;
            }
          }
          var valid5 = _errs18 === errors;
          if (!valid5) {
            const err21 = { instancePath: instancePath + "/roles", schemaPath: "#/properties/roles/propertyNames", keyword: "propertyNames", params: { propertyName: key1 }, message: "property name must be valid" };
            if (vErrors === null) {
              vErrors = [err21];
            } else {
              vErrors.push(err21);
            }
            errors++;
          }
        }
        for (const key2 in data7) {
          let data8 = data7[key2];
          if (!validate28(data8, { instancePath: instancePath + "/roles/" + key2.replace(/~/g, "~0").replace(/\//g, "~1"), parentData: data7, parentDataProperty: key2, rootData, dynamicAnchors })) {
            vErrors = vErrors === null ? validate28.errors : vErrors.concat(validate28.errors);
            errors = vErrors.length;
          }
          const _errs23 = errors;
          const _errs24 = errors;
          if (data8 && typeof data8 == "object" && !Array.isArray(data8)) {
            let missing0;
            if (data8.config_paths === void 0 && (missing0 = "config_paths")) {
              const err22 = {};
              if (vErrors === null) {
                vErrors = [err22];
              } else {
                vErrors.push(err22);
              }
              errors++;
            }
          }
          var valid8 = _errs24 === errors;
          if (valid8) {
            const err23 = { instancePath: instancePath + "/roles/" + key2.replace(/~/g, "~0").replace(/\//g, "~1"), schemaPath: "#/properties/roles/additionalProperties/allOf/1/not", keyword: "not", params: {}, message: "must NOT be valid" };
            if (vErrors === null) {
              vErrors = [err23];
            } else {
              vErrors.push(err23);
            }
            errors++;
          } else {
            errors = _errs23;
            if (vErrors !== null) {
              if (_errs23) {
                vErrors.length = _errs23;
              } else {
                vErrors = null;
              }
            }
          }
        }
      } else {
        const err24 = { instancePath: instancePath + "/roles", schemaPath: "#/properties/roles/type", keyword: "type", params: { type: "object" }, message: "must be object" };
        if (vErrors === null) {
          vErrors = [err24];
        } else {
          vErrors.push(err24);
        }
        errors++;
      }
    }
    if (data.jobs !== void 0) {
      let data9 = data.jobs;
      if (data9 && typeof data9 == "object" && !Array.isArray(data9)) {
        for (const key3 in data9) {
          const _errs27 = errors;
          if (typeof key3 === "string") {
            if (!pattern17.test(key3)) {
              const err25 = { instancePath: instancePath + "/jobs", schemaPath: "#/properties/jobs/propertyNames/pattern", keyword: "pattern", params: { pattern: "^[a-z][a-z0-9-]*$" }, message: 'must match pattern "^[a-z][a-z0-9-]*$"', propertyName: key3 };
              if (vErrors === null) {
                vErrors = [err25];
              } else {
                vErrors.push(err25);
              }
              errors++;
            }
          }
          var valid9 = _errs27 === errors;
          if (!valid9) {
            const err26 = { instancePath: instancePath + "/jobs", schemaPath: "#/properties/jobs/propertyNames", keyword: "propertyNames", params: { propertyName: key3 }, message: "property name must be valid" };
            if (vErrors === null) {
              vErrors = [err26];
            } else {
              vErrors.push(err26);
            }
            errors++;
          }
        }
        for (const key4 in data9) {
          if (!validate28(data9[key4], { instancePath: instancePath + "/jobs/" + key4.replace(/~/g, "~0").replace(/\//g, "~1"), parentData: data9, parentDataProperty: key4, rootData, dynamicAnchors })) {
            vErrors = vErrors === null ? validate28.errors : vErrors.concat(validate28.errors);
            errors = vErrors.length;
          }
        }
      } else {
        const err27 = { instancePath: instancePath + "/jobs", schemaPath: "#/properties/jobs/type", keyword: "type", params: { type: "object" }, message: "must be object" };
        if (vErrors === null) {
          vErrors = [err27];
        } else {
          vErrors.push(err27);
        }
        errors++;
      }
    }
  } else {
    const err28 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err28];
    } else {
      vErrors.push(err28);
    }
    errors++;
  }
  validate27.errors = vErrors;
  return errors === 0;
}
validate27.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
