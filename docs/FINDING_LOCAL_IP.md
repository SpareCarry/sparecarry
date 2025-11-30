# Finding Your Local IP Address

## Quick Method: Use the Script

Run this command in your project root:

```bash
node apps/mobile/scripts/get-network-ip.js
```

This will show your local network IP address and instructions on how to use it.

## Manual Methods

### Windows (PowerShell)

```powershell
ipconfig | Select-String "IPv4"
```

Or more detailed:

```powershell
ipconfig
```

Look for "IPv4 Address" under your active network adapter (usually "Wi-Fi" or "Ethernet").

### Windows (Command Prompt)

```cmd
ipconfig
```

Look for "IPv4 Address" under your active network adapter.

### Mac / Linux

```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

Or:

```bash
hostname -I
```

## Understanding Local IP vs Public IP

- **Local IP** (192.168.x.x, 10.x.x.x, 172.16.x.x): Your device's address on your local network (WiFi/router)
- **Public IP**: Your router's address on the internet (what websites see)

For mobile development, you need your **local IP** (the 192.168.x.x address).

## Starlink and Dynamic IPs

### Will Your Local IP Change?

**Yes, it can change**, but it depends on your router settings, not Starlink:

1. **Local Network IP (192.168.x.x)**:
   - Controlled by your **router**, not Starlink
   - Changes when:
     - Your router restarts
     - Your device disconnects/reconnects to WiFi
     - Your router's DHCP lease expires
   - **Solution**: Set a static IP on your router (see below)

2. **Public IP (from Starlink)**:
   - Starlink uses dynamic public IPs (changes frequently)
   - **Not relevant** for local mobile development
   - Only matters for production deployments

### Solutions for Dynamic Local IP

#### Option 1: Set Static IP on Your Router (Recommended)

Most routers allow you to reserve a static IP for specific devices:

1. **Find your device's MAC address**:
   - Windows: `ipconfig /all` → Look for "Physical Address"
   - Mac: `ifconfig en0 | grep ether`
   - Or check your router's admin panel → Connected Devices

2. **Log into your router** (usually `192.168.1.1` or `192.168.0.1`)

3. **Find "DHCP Reservations" or "Static IP" settings**

4. **Reserve your current IP** (`192.168.1.238`) for your computer's MAC address

5. **Restart your router** to apply changes

Now your local IP will always be `192.168.1.238` (or whatever you set).

#### Option 2: Set Static IP on Your Computer

**Windows**:

1. Open "Network Connections" (Win + R → `ncpa.cpl`)
2. Right-click your WiFi adapter → Properties
3. Select "Internet Protocol Version 4 (TCP/IPv4)" → Properties
4. Select "Use the following IP address"
5. Enter:
   - IP: `192.168.1.238` (or another available IP)
   - Subnet: `255.255.255.0`
   - Gateway: `192.168.1.1` (check your router's IP)
   - DNS: `8.8.8.8` (Google) or your router's IP

**Mac**:

1. System Settings → Network → WiFi → Details → TCP/IP
2. Configure IPv4: "Manually"
3. Enter IP, Subnet, Router (gateway)

#### Option 3: Check IP Before Starting Dev Server

Create a simple script to check and update your IP:

```bash
# check-ip.sh (or check-ip.bat on Windows)
node apps/mobile/scripts/get-network-ip.js
echo "Update your .env.local with the IP above"
```

Run this before starting your dev server each time.

#### Option 4: Use a Hostname (Advanced)

Some routers support local hostnames (e.g., `mycomputer.local`). Check if your router supports this feature.

## Quick Reference

### Your Current Setup

Based on the script output:

- **Local IP**: `192.168.1.238`
- **Use in `.env.local`**: `EXPO_PUBLIC_APP_URL=http://192.168.1.238:3000`
- **Use in `apps/mobile/.env`**: `EXPO_PUBLIC_APP_URL=http://192.168.1.238:3000`

### If Your IP Changes

1. Run `node apps/mobile/scripts/get-network-ip.js` to get new IP
2. Update `.env.local` and `apps/mobile/.env` with new IP
3. Update Supabase Dashboard → Authentication → URL Configuration:
   - Add new IP to Redirect URLs
   - Update Site URL if needed
4. Restart Expo with `--clear` flag

## Troubleshooting

### "Can't reach server" on mobile

1. **Check IP hasn't changed**: Run the script again
2. **Check same network**: Phone and computer must be on same WiFi
3. **Check firewall**: Windows Firewall might be blocking port 3000
4. **Check Next.js is running**: Make sure dev server is running on port 3000

### IP keeps changing

Set a static IP using Option 1 or 2 above. This is the most reliable solution.

## Summary

- ✅ **Use the script**: `node apps/mobile/scripts/get-network-ip.js`
- ✅ **Starlink doesn't affect local IP**: Your router controls it
- ✅ **Set static IP**: Prevents IP changes (recommended)
- ✅ **Check IP regularly**: If you don't set static IP, check before each dev session
