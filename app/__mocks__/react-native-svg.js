const React = require('react');
const { View } = require('react-native');

const mock = (name) => {
  const Component = ({ children, ...props }) =>
    React.createElement(View, { testID: name, ...props }, children);
  Component.displayName = name;
  return Component;
};

module.exports = {
  __esModule: true,
  default: mock('Svg'),
  Svg: mock('Svg'),
  Circle: mock('Circle'),
  Defs: mock('Defs'),
  LinearGradient: mock('LinearGradient'),
  Stop: mock('Stop'),
  Path: mock('Path'),
  G: mock('G'),
  Rect: mock('Rect'),
  Text: mock('Text'),
};
