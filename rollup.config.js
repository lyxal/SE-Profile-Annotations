import { readFileSync } from "fs";

const header = readFileSync("./header.txt", "utf-8");

export default {
  input: "main.js",
  output: {
    file: "dist/annotations.user.js",
    format: "iife",
  },
  plugins: [
    {
      name: "async-iife",
      renderChunk(code) {
        const asyncCode = code.replace(
          /\(function(\s*)(\w*\s*)\(/,
          "(async function$1$2("
        );
        return header + "\n" + asyncCode;
      },
    },
  ],
};
