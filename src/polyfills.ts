import { Buffer } from 'buffer';
import process from 'process';
import { decode, encode } from 'base-64';
import 'fast-text-encoding';

declare global {
  // @ts-ignore
  var Buffer: typeof Buffer;
  // @ts-ignore
  var process: typeof process;
  // @ts-ignore
  var btoa: (text: string) => string;
  // @ts-ignore
  var atob: (text: string) => string;
  // @ts-ignore
  var TextEncoder: any;
  // @ts-ignore
  var TextDecoder: any;
}

if (typeof globalThis.Buffer === 'undefined') {
  globalThis.Buffer = Buffer;
}

if (typeof globalThis.process === 'undefined') {
  globalThis.process = process;
}

if (typeof globalThis.btoa === 'undefined') {
  globalThis.btoa = encode;
}

if (typeof globalThis.atob === 'undefined') {
  globalThis.atob = decode;
}

if (typeof global !== 'undefined') {
  if (typeof global.Buffer === 'undefined') {
    global.Buffer = Buffer;
  }
  if (typeof global.process === 'undefined') {
    global.process = process;
  }
  if (typeof global.btoa === 'undefined') {
    global.btoa = encode;
  }
  if (typeof global.atob === 'undefined') {
    global.atob = decode;
  }
}
