import { execSync } from "node:child_process";

export function ssh(vps, remoteCmd, { cwd } = {}) {
  const key = vps.VPS_SSH_KEY_PATH.replace(/\\/g, "/");
  const target = `${vps.VPS_USER}@${vps.VPS_IP}`;
  const cmd = `ssh -i "${key}" -o BatchMode=yes -o StrictHostKeyChecking=accept-new ${target} "${remoteCmd.replace(/"/g, '\\"')}"`;
  console.log(`\n$ ${cmd}`);
  execSync(cmd, { stdio: "inherit", cwd });
}

export function scp(vps, local, remote, { cwd } = {}) {
  const key = vps.VPS_SSH_KEY_PATH.replace(/\\/g, "/");
  const target = `${vps.VPS_USER}@${vps.VPS_IP}`;
  const cmd = `scp -i "${key}" -o BatchMode=yes "${local}" ${target}:${remote}`;
  console.log(`\n$ ${cmd}`);
  execSync(cmd, { stdio: "inherit", cwd });
}
