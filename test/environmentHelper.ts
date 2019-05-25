export const setupEnv = (envKey: string, value: string | undefined) => {
    const backupEnv = process.env[envKey];
  
    process.env[envKey] = value;
  
    return function restore() {
      if (typeof backupEnv !== 'undefined') {
        process.env[envKey] = backupEnv;
      } else {
        delete process.env[envKey];
      }
    };
  };