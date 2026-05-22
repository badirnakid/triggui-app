const { withAndroidStyles } = require('@expo/config-plugins');

const THEME_NAME = 'AppTheme';
const ITEM_NAME = 'android:enforceNavigationBarContrast';

module.exports = function withNavBarContrast(config) {
  return withAndroidStyles(config, (config) => {
    const styles = config.modResults;
    const style = styles?.resources?.style?.find((s) => s.$.name === THEME_NAME);
    if (style) {
      style.item = (style.item || []).filter((i) => i.$.name !== ITEM_NAME);
      style.item.push({ _: 'false', $: { name: ITEM_NAME, 'tools:targetApi': '29' } });
    }
    return config;
  });
};
