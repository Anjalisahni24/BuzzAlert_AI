const React = require("react");
const { View } = require("react-native");

const MapView = React.forwardRef(function MapView({ style, children }, ref) {
  return React.createElement(View, { style, ref }, children);
});

function Circle() { return null; }
function Marker({ children }) { return null; }

const PROVIDER_DEFAULT = null;
const PROVIDER_GOOGLE = "google";

module.exports = MapView;
module.exports.default = MapView;
module.exports.Circle = Circle;
module.exports.Marker = Marker;
module.exports.PROVIDER_DEFAULT = PROVIDER_DEFAULT;
module.exports.PROVIDER_GOOGLE = PROVIDER_GOOGLE;
