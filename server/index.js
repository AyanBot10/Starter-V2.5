const express = require('express');
const os = require('os');
const app = express();
const port = global?.config?.server?.port || 3000;

function formatUptime(uptimeInSeconds) {
  const hours = Math.floor(uptimeInSeconds / 3600);
  const minutes = Math.floor((uptimeInSeconds % 3600) / 60);
  const seconds = Math.floor(uptimeInSeconds % 60);
  return `${hours}H, ${minutes}M, ${seconds}S`;
}

app.get("/logs", (req, res) => {
  const response = {
    status: global?.config?.save_logs_in_server,
    logs: global?.config?.save_logs_in_server ? [...global.server?.logs] || [] : "save_logs_in_server disabled"
  };
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(response, null, 2));
});

app.get('*', (req, res) => {

  const response = {
    systemInfo: system(),
    global_entries: Object.keys(global),
    timestamp: new Date().toISOString()
  };

  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(response, null, 2));
});

app.listen(port, () => {
  global.log("Successfully Started Server at Port " + port, "cyan", true)
});

module.exports = app;

function system() {
  return {
    platform: os.platform(),
    arch: os.arch(),
    cpu: os.cpus(),
    memory: {
      total: os.totalmem(),
      free: os.freemem()
    },
    uptime: {
      os: os.platform(),
      uptime_readable: formatUptime(os.uptime()),
      uptime: os.uptime()
    },
    loadAvg: os.loadavg(),
    networkInterfaces: os.networkInterfaces(),
    userInfo: os.userInfo()
  }
}