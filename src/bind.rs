use crate::common::individual2obj;
use neon::prelude::*;
use std::cell::RefCell;
use std::io;
use std::io::{Error, ErrorKind};
use v_common::module::module_impl::{get_cmd, get_inner_binobj_as_individual};
use v_common::onto::individual::{Individual, RawObj};
use v_common::onto::parser::parse_raw;
use v_common::v_api::api_client::IndvOp;
use v_queue::record::{ErrorQueue, Mode};

pub struct Consumer {
    queue_consumer: v_queue::consumer::Consumer,
}

impl Finalize for Consumer {}

impl Consumer {
    fn new(base_path: &str, consumer_name: &str, queue_name: &str) -> io::Result<Self> {
        if let Ok(c) = v_queue::consumer::Consumer::new_with_mode(base_path, consumer_name, queue_name, Mode::ReadWrite) {
            Ok(Self {
                queue_consumer: c,
            })
        } else {
            Err(Error::new(ErrorKind::Other, ""))
        }
    }

    fn get_id(&self) -> u32 {
        self.queue_consumer.id
    }

    fn get_queue_id(&self) -> u32 {
        self.queue_consumer.queue.id
    }

    fn get_info_of_part(&mut self, part_id: u32) -> Result<(), ErrorQueue> {
        self.queue_consumer.queue.get_info_of_part(part_id, true)
    }

    fn open_part(&mut self, part_id: u32) -> Result<(), ErrorQueue> {
        self.queue_consumer.queue.open_part(part_id)
    }

    fn get_info_queue(&mut self) -> bool {
        self.queue_consumer.queue.get_info_queue()
    }

    fn get_batch_size(&mut self) -> u32 {
        self.queue_consumer.get_batch_size()
    }

    fn get_message_length(&self) -> u32 {
        self.queue_consumer.header.msg_length
    }

    fn pop_header(&mut self) -> bool {
        self.queue_consumer.pop_header()
    }

    fn pop_body(&mut self, msg: &mut [u8]) -> Result<usize, ErrorQueue> {
        self.queue_consumer.pop_body(msg)
    }

    //fn seek_next_pos(&mut self) -> bool {
    //    self.queue_consumer.seek_next_pos()
    //}

    fn commit(&mut self) -> bool {
        self.queue_consumer.commit()
    }
}

pub fn consumer_new(mut cx: FunctionContext) -> JsResult<JsBox<Consumer>> {
    let base_path = cx.argument::<JsString>(0)?.value(&mut cx);
    let consumer_name = cx.argument::<JsString>(1)?.value(&mut cx);
    let queue_name = cx.argument::<JsString>(2)?.value(&mut cx);

    if let Ok(c) = Consumer::new(&base_path, &consumer_name, &queue_name) {
        Ok(cx.boxed(c))
    } else {
        cx.throw_error("E1")
    }
}

pub fn ref_consumer_new(mut cx: FunctionContext) -> JsResult<JsValue> {
    let base_path = cx.argument::<JsString>(0)?.value(&mut cx);
    let consumer_name = cx.argument::<JsString>(1)?.value(&mut cx);
    let queue_name = cx.argument::<JsString>(2)?.value(&mut cx);

    if let Ok(c) = Consumer::new(&base_path, &consumer_name, &queue_name) {
        Ok(cx.boxed(RefCell::new(c)).upcast())
    } else {
        cx.throw_error("E2")
    }
}

pub fn ref_consumer_get_id(mut cx: FunctionContext) -> JsResult<JsNumber> {
    let consumer = cx.argument::<JsBox<RefCell<Consumer>>>(0)?;
    let id = cx.number(consumer.borrow().get_id());

    Ok(id)
}

pub fn ref_consumer_get_queue_id(mut cx: FunctionContext) -> JsResult<JsNumber> {
    let consumer = cx.argument::<JsBox<RefCell<Consumer>>>(0)?;
    let id = cx.number(consumer.borrow().get_queue_id());

    Ok(id)
}

pub fn ref_get_info_of_part(mut cx: FunctionContext) -> JsResult<JsUndefined> {
    let consumer = cx.argument::<JsBox<RefCell<Consumer>>>(0)?;
    let part_id = cx.argument::<JsNumber>(1)?.value(&mut cx);
    let mut borrow_mut = consumer.borrow_mut();

    if let Err(_e) = borrow_mut.get_info_of_part(part_id as u32) {
        return cx.throw_error("E3");
    }

    Ok(cx.undefined())
}

pub fn ref_queue_open_part(mut cx: FunctionContext) -> JsResult<JsUndefined> {
    let consumer = cx.argument::<JsBox<RefCell<Consumer>>>(0)?;
    let part_id = cx.argument::<JsNumber>(1)?.value(&mut cx);
    let mut borrow_mut = consumer.borrow_mut();

    if let Err(_e) = borrow_mut.open_part(part_id as u32) {
        return cx.throw_error("E4");
    }

    Ok(cx.undefined())
}

pub fn ref_get_info_queue(mut cx: FunctionContext) -> JsResult<JsUndefined> {
    let consumer = cx.argument::<JsBox<RefCell<Consumer>>>(0)?;
    let mut borrow_mut = consumer.borrow_mut();

    if !borrow_mut.get_info_queue() {
        return cx.throw_error("E5");
    }

    Ok(cx.undefined())
}

pub fn ref_get_batch_size(mut cx: FunctionContext) -> JsResult<JsNumber> {
    let consumer = cx.argument::<JsBox<RefCell<Consumer>>>(0)?;
    let mut borrow_mut = consumer.borrow_mut();
    let size = borrow_mut.get_batch_size();

    Ok(cx.number(size))
}

pub fn ref_commit(mut cx: FunctionContext) -> JsResult<JsBoolean> {
    let consumer = cx.argument::<JsBox<RefCell<Consumer>>>(0)?;
    let mut borrow_mut = consumer.borrow_mut();
    let res = borrow_mut.commit();

    Ok(cx.boolean(res))
}

pub fn ref_pop_element(mut cx: FunctionContext) -> JsResult<JsObject> {
    let consumer = cx.argument::<JsBox<RefCell<Consumer>>>(0)?;
    let mut borrow_mut = consumer.borrow_mut();

    if !borrow_mut.pop_header() {
        //("[WARN] [module] consumer:pop_element:pop_header return empty");

        if borrow_mut.get_batch_size() > 0 {
            //println!("[WARN] [module] consumer:pop_element:get_batch_size={}", borrow_mut.get_batch_size());
            borrow_mut.get_info_queue();
            //println!("[WARN] [module] consumer:pop_element:refresh info_queue");
        }

        return Ok(cx.empty_object());
    }

    let mut raw = RawObj::new(vec![0; (borrow_mut.get_message_length()) as usize]);

    if let Err(e) = borrow_mut.pop_body(&mut raw.data) {
        return match e {
            ErrorQueue::FailReadTailMessage => {
                //println!("[WARN] [module] consumer:pop_body: Fail Read Tail Message");
                Ok(cx.empty_object())
            },
            ErrorQueue::InvalidChecksum => {
                //println!("[WARN] [module] consumer:pop_body: invalid CRC, attempt seek next record");
                borrow_mut.queue_consumer.seek_next_pos();
                Ok(cx.empty_object())
            },
            _ => {
                //println!("[WARN] consumer:pop_body: {}", e.as_str());
                Ok(cx.empty_object())
            },
        }
    }

    let mut queue_element = Individual::new_raw(raw);
    if parse_raw(&mut queue_element).is_ok() {
        let op_id = queue_element.get_first_integer("op_id").unwrap_or_default();

        let mut prev_state = Individual::default();
        get_inner_binobj_as_individual(&mut queue_element, "prev_state", &mut prev_state);
        prev_state.parse_all();

        let mut new_state = Individual::default();
        get_inner_binobj_as_individual(&mut queue_element, "new_state", &mut new_state);
        new_state.parse_all();

        let obj = cx.empty_object();

        if let Some(v) = queue_element.get_first_literal("uri") {
            let jv = cx.string(v);
            obj.set(&mut cx, "uri", jv)?;
        }

        if !prev_state.get_id().is_empty() {
            let j_prev_state = individual2obj(&mut cx, &mut prev_state)?;
            obj.set(&mut cx, "prev_state", j_prev_state)?;
        }

        if !new_state.get_id().is_empty() {
            let j_new_state = individual2obj(&mut cx, &mut new_state)?;
            obj.set(&mut cx, "new_state", j_new_state)?;
        }

        if let Some(cmd) = get_cmd(&mut queue_element) {
            if cmd == IndvOp::Put {
                let v = cx.string("put");
                obj.set(&mut cx, "cmd", v)?;
            } else if cmd == IndvOp::Remove {
                let v = cx.string("remove");
                obj.set(&mut cx, "cmd", v)?;
            }
        }

        let v = cx.number(op_id as f64);
        obj.set(&mut cx, "op_id", v)?;

        return Ok(obj);
    }

    //println!("[WARN] [module] consumer, fail parse queue element");
    return Ok(cx.empty_object());
}

#[neon::main]
fn main(mut cx: ModuleContext) -> NeonResult<()> {
    cx.export_function("consumerNew", ref_consumer_new)?;
    cx.export_function("consumerGetPartId", ref_consumer_get_id)?;
    cx.export_function("consumerGetQueuePartId", ref_consumer_get_queue_id)?;
    cx.export_function("consumerRefreshInfoOfPart", ref_get_info_of_part)?;
    cx.export_function("consumerRefreshInfoQueue", ref_get_info_queue)?;
    cx.export_function("consumerQueueOpenPart", ref_queue_open_part)?;
    cx.export_function("consumerGetBatchSize", ref_get_batch_size)?;
    cx.export_function("consumerPopElement", ref_pop_element)?;
    cx.export_function("consumerCommit", ref_commit)?;

    Ok(())
}
