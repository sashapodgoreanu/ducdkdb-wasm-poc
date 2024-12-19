(module
  (type (;0;) (func))
  (type (;1;) (func (result i32)))
  (type (;2;) (func (param i32)))
  (type (;3;) (func (param i32 i32) (result i32)))
  (import "wasi_snapshot_preview1" "proc_exit" (func (;0;) (type 2)))
  (func (;1;) (type 0)
    call 9)
  (func (;2;) (type 1) (result i32)
    (local i32 i32 i32 i32 i32)
    global.get 0
    local.set 0
    i32.const 16
    local.set 1
    local.get 0
    local.get 1
    i32.sub
    local.set 2
    i32.const 0
    local.set 3
    local.get 2
    local.get 3
    i32.store offset=12
    i32.const 0
    local.set 4
    local.get 4
    return)
  (func (;3;) (type 3) (param i32 i32) (result i32)
    (local i32 i32 i32 i32 i32 i32 i32 i32 i32 i32 i32 i32 i32 i32 i32 i32 i32 i32 i32 i32 i32 i32)
    global.get 0
    local.set 2
    i32.const 16
    local.set 3
    local.get 2
    local.get 3
    i32.sub
    local.set 4
    local.get 4
    local.get 0
    i32.store offset=12
    local.get 4
    local.get 1
    i32.store offset=8
    i32.const 0
    local.set 5
    local.get 4
    local.get 5
    i32.store offset=4
    i32.const 0
    local.set 6
    local.get 4
    local.get 6
    i32.store
    block  ;; label = @1
      loop  ;; label = @2
        local.get 4
        i32.load
        local.set 7
        local.get 4
        i32.load offset=8
        local.set 8
        local.get 7
        local.get 8
        i32.lt_s
        local.set 9
        i32.const 1
        local.set 10
        local.get 9
        local.get 10
        i32.and
        local.set 11
        local.get 11
        i32.eqz
        br_if 1 (;@1;)
        local.get 4
        i32.load offset=12
        local.set 12
        local.get 4
        i32.load
        local.set 13
        i32.const 2
        local.set 14
        local.get 13
        local.get 14
        i32.shl
        local.set 15
        local.get 12
        local.get 15
        i32.add
        local.set 16
        local.get 16
        i32.load
        local.set 17
        local.get 4
        i32.load offset=4
        local.set 18
        local.get 18
        local.get 17
        i32.add
        local.set 19
        local.get 4
        local.get 19
        i32.store offset=4
        local.get 4
        i32.load
        local.set 20
        i32.const 1
        local.set 21
        local.get 20
        local.get 21
        i32.add
        local.set 22
        local.get 4
        local.get 22
        i32.store
        br 0 (;@2;)
      end
      unreachable
    end
    local.get 4
    i32.load offset=4
    local.set 23
    local.get 23
    return)
  (func (;4;) (type 0)
    block  ;; label = @1
      i32.const 1
      i32.eqz
      br_if 0 (;@1;)
      call 1
    end
    call 2
    call 7
    unreachable)
  (func (;5;) (type 0))
  (func (;6;) (type 0)
    (local i32)
    i32.const 0
    local.set 0
    block  ;; label = @1
      i32.const 0
      i32.const 0
      i32.le_u
      br_if 0 (;@1;)
      loop  ;; label = @2
        local.get 0
        i32.const -4
        i32.add
        local.tee 0
        i32.load
        call_indirect (type 0)
        local.get 0
        i32.const 0
        i32.gt_u
        br_if 0 (;@2;)
      end
    end
    call 5)
  (func (;7;) (type 2) (param i32)
    call 5
    call 6
    call 5
    local.get 0
    call 8
    unreachable)
  (func (;8;) (type 2) (param i32)
    local.get 0
    call 0
    unreachable)
  (func (;9;) (type 0)
    i32.const 65536
    global.set 2
    i32.const 0
    i32.const 15
    i32.add
    i32.const -16
    i32.and
    global.set 1)
  (func (;10;) (type 1) (result i32)
    global.get 0
    global.get 1
    i32.sub)
  (func (;11;) (type 1) (result i32)
    global.get 2)
  (func (;12;) (type 1) (result i32)
    global.get 1)
  (func (;13;) (type 2) (param i32)
    local.get 0
    global.set 0)
  (func (;14;) (type 1) (result i32)
    global.get 0)
  (table (;0;) 2 2 funcref)
  (memory (;0;) 257 257)
  (global (;0;) (mut i32) (i32.const 65536))
  (global (;1;) (mut i32) (i32.const 0))
  (global (;2;) (mut i32) (i32.const 0))
  (export "memory" (memory 0))
  (export "sumArrayInt32" (func 3))
  (export "__indirect_function_table" (table 0))
  (export "_start" (func 4))
  (export "emscripten_stack_init" (func 9))
  (export "emscripten_stack_get_free" (func 10))
  (export "emscripten_stack_get_base" (func 11))
  (export "emscripten_stack_get_end" (func 12))
  (export "_emscripten_stack_restore" (func 13))
  (export "emscripten_stack_get_current" (func 14))
  (elem (;0;) (i32.const 1) func 1))
