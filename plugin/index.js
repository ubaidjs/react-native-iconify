const { locate } = require('@iconify/json');
const {
  stringToIcon,
  iconToHTML,
  iconToSVG,
  getIconData,
} = require('@iconify/utils');

module.exports = function (babel) {
  const { types: t } = babel;

  return {
    name: 'react-native-iconify',
    visitor: {
      JSXElement(path) {
        const { openingElement } = path.node;
        const tagName = openingElement.name.name;
        const isIcon = tagName === 'Iconify';

        if (!isIcon) {
          return;
        }

        const iconProp = openingElement.attributes.find(
          (node) => t.isJSXAttribute(node) && node.name.name === 'icon'
        );

        const iconValue =
          iconProp?.value?.value ||
          iconProp?.value?.expression?.value ||
          iconProp?.value?.expression?.extra?.rawValue;

        if (!iconValue) {
          throw new Error("Iconify: 'icon' prop must be a string literal");
        }

        const icon = stringToIcon(iconValue);

        const filename = locate(icon.prefix);

        let iconAsJson;

        try {
          iconAsJson = require(filename);
        } catch (error) {
          throw new Error(`Iconify: Could not find icon set "${icon.prefix}"`);
        }

        const iconData = getIconData(iconAsJson, icon.name);

        if (!iconData) {
          throw new Error(
            `Iconify: Icon not found!\nCould not find icon ${iconValue}\n\nCheck all icons at\nhttps://iconify.design/icon-sets/`
          );
        }

        const renderData = iconToSVG(iconData, {
          height: 'auto',
        });

        const svg = iconToHTML(renderData.body, renderData.attributes);

        const svgProp = t.jSXAttribute(
          t.jSXIdentifier('svg'),
          t.jSXExpressionContainer(t.stringLiteral(svg))
        );

        const isPluginInstalledProp = t.jSXAttribute(
          t.jSXIdentifier('isPluginInstalled'),
          t.jSXExpressionContainer(t.booleanLiteral(true))
        );

        openingElement.attributes.push(svgProp);
        openingElement.attributes.push(isPluginInstalledProp);
      },
    },
  };
};
