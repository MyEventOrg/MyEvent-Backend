const { createDefaultPreset } = require("ts-jest");

const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import("jest").Config} **/
module.exports = {
  testEnvironment: "node",
  transform: {
    ...tsJestTransformCfg,
  },

  // 🟦 SOLUCIÓN PARA QUE JEST TERMINE LA EJECUCIÓN
  forceExit: true,
  detectOpenHandles: true,
};
