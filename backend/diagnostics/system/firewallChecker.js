/**
 * Windows Firewall Checker
 * Checks firewall status and rules affecting MongoDB ports
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

async function checkFirewall() {
  const result = {
    platform: process.platform,
    applicable: process.platform === 'win32',
    firewallEnabled: false,
    rules: [],
    potentialBlocks: [],
    error: null
  };

  if (!result.applicable) {
    result.error = 'Firewall check not applicable (non-Windows platform)';
    return result;
  }

  try {
    // Check if firewall is enabled
    const profileCmd = 'Get-NetFirewallProfile | Select-Object Name, Enabled | Format-Table -HideTableHeaders';
    const { stdout: profileOutput } = await execAsync(`powershell -Command "${profileCmd}"`, { timeout: 10000 });
    
    result.firewallEnabled = profileOutput.toLowerCase().includes('true');

    if (result.firewallEnabled) {
      // Check for rules affecting MongoDB ports
      const ruleCmd = 'Get-NetFirewallRule | Where-Object {$_.Enabled -eq "True"} | Select-Object DisplayName, Direction, Action | Format-Table -HideTableHeaders';
      const { stdout: ruleOutput } = await execAsync(`powershell -Command "${ruleCmd}"`, { timeout: 10000 });
      
      // Parse rules (simplified parsing)
      const lines = ruleOutput.split('\n').filter(line => line.trim());
      for (const line of lines) {
        const parts = line.trim().split(/\s{2,}/);
        if (parts.length >= 3) {
          const rule = {
            name: parts[0],
            direction: parts[1].toLowerCase(),
            action: parts[2].toLowerCase()
          };
          
          // Check if rule might affect MongoDB
          if (rule.action === 'block' && rule.direction === 'outbound') {
            result.potentialBlocks.push(rule.name);
          }
          
          result.rules.push(rule);
        }
      }
    }
  } catch (error) {
    result.error = `PowerShell execution error: ${error.message}`;
  }

  return result;
}

module.exports = {
  checkFirewall
};
