module.exports = {
  apps: [
    {
      name: 'educonnect',
      script: 'npx',
      args: 'next dev --turbopack --port 3000 --hostname 0.0.0.0',
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      watch: false,
      instances: 1,
      exec_mode: 'fork'
    }
  ]
}
