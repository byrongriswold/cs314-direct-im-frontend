import "@testing-library/jest-dom"; // if you want jest-dom matchers
import { TextEncoder, TextDecoder } from "util";

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;