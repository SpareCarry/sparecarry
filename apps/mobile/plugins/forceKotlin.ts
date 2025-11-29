// apps/mobile/plugins/forceKotlin.ts
// Config plugin to force Kotlin 2.x into the generated Android project so that
// expo-root-project / KSP see a supported Kotlin version on EAS.

import type { ConfigPlugin } from '@expo/config-plugins';
import { withDangerousMod } from '@expo/config-plugins';
import fs from 'fs';
import path from 'path';

const FORCE_KOTLIN = '2.0.0'; // can be bumped to 2.1.x / 2.2.x if needed

const ensureGradleProperties = (androidDir: string) => {
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

const ensureBuildGradleExt = (androidDir: string) => {
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

const withForceKotlin: ConfigPlugin = (config) => {
  return withDangerousMod(config, [
    'android',
    async (modConfig) => {
      const projectRoot = modConfig.modRequest.projectRoot;
      const androidDir = path.join(projectRoot, 'android');

      try {
        ensureGradleProperties(androidDir);
        ensureBuildGradleExt(androidDir);
      } catch (e: any) {
        console.warn(
          'forceKotlin plugin: failed to write Kotlin settings; android dir may not exist yet.',
          e?.message ?? e,
        );
      }

      return modConfig;
    },
  ]);
};

export default withForceKotlin;


