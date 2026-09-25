// Replaces Emscripten's module-lifetime UTF8Decoder and UTF16Decoder with
// decoders that retire their native TextDecoder before it has seen 1 GiB.
//
// Safari 18 (WebKit safari-7619 to safari-7621) counts bytes across every
// decode() call on one TextDecoder and throws a message-less RangeError on
// every call once the total passes 2^31 - 1, and the stock glue sends every
// SQLite text value through one decoder for the life of the module. Half the
// cap leaves room for a maximal single string.
//
// Linked with --js-library, which overrides Emscripten's own definitions of
// these symbols on every build.
addToLibrary({
  $boundedTextDecoder: (label) => {
    var budget = 0x40000000
    var decoded = 0
    var streaming = false
    var native = new TextDecoder(label)
    return {
      decode(input, options) {
        var length = input ? input.byteLength : 0
        // A streaming decode() holds a partial sequence, so replace only between calls.
        if (!streaming && decoded + length > budget) {
          native = new TextDecoder(label)
          decoded = 0
        }
        decoded += length
        streaming = !!(options && options.stream)
        return native.decode(input, options)
      },
    }
  },

  $UTF8Decoder__deps: ["$boundedTextDecoder"],
  $UTF8Decoder: "boundedTextDecoder()",

  $UTF16Decoder__deps: ["$boundedTextDecoder"],
  $UTF16Decoder: "boundedTextDecoder('utf-16le')",
})
