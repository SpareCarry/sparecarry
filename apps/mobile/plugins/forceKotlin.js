// apps/mobile/plugins/forceKotlin.js
// CommonJS version of the forceKotlin config plugin so EAS can load it
// without needing TypeScript support.

const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const FORCE_KOTLIN = '2.0.0'; // can be bumped to 2.1.x / 2.2.x if needed

const ensureGradleProperties = (androidDir) => {
  const gradleProps = path.join(androidDir, 'gradle.properties');
  let content = '';

  if (fs.existsSync(gradleProps)) {
    content = fs.readFileSync(gradleProps, 'utf8');

    if (/^\s*kotlinVersion\s*=.*$/m.test(content)) {
      content = content.replace(
        /^\s*kotlinVersion\s*=.*$/m,
        `kotlinVersion=${FORCE_KOTLIN}`,
      );
    } else {
      content = `${content.trim()}\n\nkotlinVersion=${FORCE_KOTLIN}\n`;
    }
  } else {
    content = `kotlinVersion=${FORCE_KOTLIN}\n`;
  }

  fs.writeFileSync(gradleProps, content, 'utf8');
};

const ensureBuildGradleExt = (androidDir) => {
  const buildGradle = path.join(androidDir, 'build.gradle');
  if (!fs.existsSync(buildGradle)) return;

  let content = fs.readFileSync(buildGradle, 'utf8');

  if (!/ext\.kotlin_version\s*=/.test(content)) {
    const insertAt =
      content.indexOf('buildscript') >= 0 ? content.indexOf('buildscript') : 0;
    const prefix = insertAt > 0 ? content.slice(0, insertAt) : '';
    const rest = insertAt > 0 ? content.slice(insertAt) : content;
    const extLine = `ext.kotlin_version = '${FORCE_KOTLIN}'\n`;
    content = `${prefix}${extLine}${rest}`;
  } else {
    content = content.replace(
      /ext\.kotlin_version\s*=\s*['"].*?['"]/g,
      `ext.kotlin_version = '${FORCE_KOTLIN}'`,
    );
  }

  fs.writeFileSync(buildGradle, content, 'utf8');
};

const withForceKotlin = (config) =>
  withDangerousMod(config, [
    'android',
    async (modConfig) => {
      const projectRoot = modConfig.modRequest.projectRoot;
      const androidDir = path.join(projectRoot, 'android');

      try {
        ensureGradleProperties(androidDir);
        ensureBuildGradleExt(androidDir);
      } catch (e) {
        console.warn(
          'forceKotlin plugin (JS): failed to write Kotlin settings; android dir may not exist yet.',
          e && e.message ? e.message : e,
        );
      }

      return modConfig;
    },
  ]);

module.exports = withForceKotlin;


