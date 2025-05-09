import type { JestConfigWithTsJest } from "ts-jest";

const jestConfig: JestConfigWithTsJest = {
    testPathIgnorePatterns: ["dist", "/node_modules/"],
    preset: "ts-jest",
    testTimeout: 30000
};

export default jestConfig;
