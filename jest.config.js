module.exports = {
  roots: ['<rootDir>'],
  testMatch:[
  	'(/__tests__/.*|(\\.|/)(test|spec))\\.tsx?$',
  	"**/?(*.)+(spec|test).+(ts|tsx|js)"
  ],
  moduleFileExtensions: ['ts', 'js'],
  preset: 'ts-jest',
  testEnvironment: "node",
  transform: {
    "^.+\\.(ts|tsx)$": "ts-jest",
  },
}