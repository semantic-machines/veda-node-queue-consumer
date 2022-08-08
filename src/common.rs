use neon::prelude::*;
use neon::types::JsDate;
use rust_decimal::prelude::ToPrimitive;
use rust_decimal::Decimal;
use v_common::onto::datatype::Lang;
use v_common::onto::individual::Individual;
use v_common::onto::resource::Value;

pub fn individual2obj<'a>(cx: &mut FunctionContext<'a>, src: &mut Individual) -> JsResult<'a, JsObject> {
    let v8_obj = cx.empty_object();

    let v = cx.string(src.get_id());
    v8_obj.set(cx, "@", v)?;

    let map_resources = src.get_obj().get_resources();
    for (predicate, resources) in map_resources {
        let js_resources = cx.empty_array();

        for (idx, resource) in resources.iter().enumerate() {
            let v8_value = cx.empty_object();
            js_resources.set(cx, idx as u32, v8_value)?;

            match &resource.value {
                Value::Num(m, e) => {
                    let scale = if *e < 0 {
                        (*e * -1) as u32
                    } else {
                        0
                    };

                    let num = if *e > 0 {
                        *m * 10_i64.pow(*e as u32)
                    } else {
                        *m
                    };

                    let d = Decimal::new(num, scale);

                    let v = cx.number(d.to_f64().unwrap_or_default());
                    v8_value.set(cx, "data", v)?;

                    let t = cx.string("Decimal");
                    v8_value.set(cx, "type", t)?;
                },
                Value::Int(i) => {
                    let i_val = *i;

                    let v = cx.number(i_val as f64);
                    v8_value.set(cx, "data", v)?;

                    let t = cx.string("Integer");
                    v8_value.set(cx, "type", t)?;
                },
                Value::Datetime(i) => {
                    let dt = *i;
                    let v = JsDate::new_lossy(cx, (dt * 1000) as f64);
                    v8_value.set(cx, "data", v)?;
                    let t = cx.string("Datetime");
                    v8_value.set(cx, "type", t)?;
                },
                Value::Bool(b) => {
                    let v = cx.boolean(*b);
                    v8_value.set(cx, "data", v)?;

                    let t = cx.string("Boolean");
                    v8_value.set(cx, "type", t)?;
                },
                Value::Str(s, l) => {
                    if *l != Lang::none() {
                        let l = cx.string(&l.to_string().to_uppercase());
                        v8_value.set(cx, "lang", l)?;
                    }
                    let v = cx.string(s);
                    v8_value.set(cx, "data", v)?;

                    let t = cx.string("String");
                    v8_value.set(cx, "type", t)?;
                },
                Value::Uri(s) => {
                    let v = cx.string(s);
                    v8_value.set(cx, "data", v)?;

                    let t = cx.string("Uri");
                    v8_value.set(cx, "type", t)?;
                },
                _ => {},
            }
        }

        let key = cx.string(predicate);
        v8_obj.set(cx, key, js_resources)?;
    }

    Ok(v8_obj)
}
