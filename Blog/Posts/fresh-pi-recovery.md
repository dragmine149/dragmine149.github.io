# Steps followed after reinstalling the pi on nvme ssd from fresh (and restoring from backup)

## Note: Booting from sdcard -> nvme
```zsh
sudo raspi-config
6
A4
1/2 # (depending on direction)
```

## 1. Update
```bash
sudo apt update && sudo apt upgrade
```

## 2. Install essential QOL packages
```bash
sudo apt install nala

sudo shutdown -r 0 # Restart to make sure things have been updated.

sudo nala update

## Get fastfetch from src as its not in stable debian
wget https://github.com/fastfetch-cli/fastfetch/releases/download/2.17.2/fastfetch-linux-aarch64.deb
sudo nala install ./fastfetch-linux-aarch64.deb

sudo nala install micro btop
```
These are packages that are not needed but just make working with the system a TON better.

## 3. Check system is ok via fastfetch
```bash
fastfetch
```
```rs
       _,met$$$$$gg.           pi@raspberrypi
    ,g$$$$$$$$$$$$$$$P.        --------------
  ,g$$P"         """Y$$.".     OS: Debian GNU/Linux bookworm 12.11 aarch64
 ,$$P'               `$$$.     Host: Raspberry Pi 5 Model B Rev 1.0
',$$P       ,ggs.     `$$b:    Kernel: Linux 6.12.25+rpt-rpi-2712
`d$$'     ,$P"'   .    $$$     Uptime: 5 mins
 $$P      d$'     ,    $$$P    Packages: 1603 (dpkg)
 $$:      $.   -    ,d$$'      Shell: bash 5.2.15
 $$;      Y$b._   _,d$P'       Display (Headless output 2): 1920x1080 @ 1295651Hz
 Y$$.    `.`"Y$$$$P"'          WM: labwc (Wayland)
 `$$b      "-.__               Cursor: Adwaita
  `Y$$                         Terminal: /dev/pts/0
   `Y$$.                       CPU: Cortex-A76 (4) @ 2.40 GHz
     `$$b.                     GPU: V3D 7.1.7.0 [Integrated]
       `Y$$b.                  Memory: 788.89 MiB / 7.87 GiB (10%)
          `"Y$b._              Swap: 0 B / 511.98 MiB (0%)
             `"""              Disk (/): 4.96 GiB / 234.17 GiB (2%) - ext4
                               Disk (/media/pi/bootfs): 76.86 MiB / 509.99 MiB (15%) - vfat
                               Disk (/media/pi/rootfs): 6.12 GiB / 13.66 GiB (45%) - ext4
                               Local IP (eth0): 192.168.120.15/24 *
                               Locale: en_GB.UTF-8

                               ████████████████████████
                               ████████████████████████
```

## 4. Update to DebianTesting from DebianStable
This gives us access to more up to date things, one of which i need later.
***Following this guide: https://wiki.debian.org/DebianTesting***

```bash
sudo micro /etc/apt/sources.list
```

```
deb http://deb.debian.org/debian bookworm main contrib non-free non-free-firmware
deb http://deb.debian.org/debian-security/ bookworm-security main contrib non-free non-free-firmware
deb http://deb.debian.org/debian bookworm-updates main contrib non-free non-free-firmware
# Uncomment deb-src lines below then 'apt-get update' to enable 'apt-get source'
#deb-src http://deb.debian.org/debian bookworm main contrib non-free non-free-firmware
#deb-src http://deb.debian.org/debian-security/ bookworm-security main contrib non-free non-free-firmware
#deb-src http://deb.debian.org/debian bookworm-updates main contrib non-free non-free-firmware
```
to
```
deb http://deb.debian.org/debian testing main contrib non-free non-free-firmware
deb http://deb.debian.org/debian-security/ testing-security main contrib non-free non-free-firmware
#deb http://deb.debian.org/debian bookworm-updates main contrib non-free non-free-firmware
# Uncomment deb-src lines below then 'apt-get update' to enable 'apt-get source'
#deb-src http://deb.debian.org/debian bookworm main contrib non-free non-free-firmware
#deb-src http://deb.debian.org/debian-security/ bookworm-security main contrib non-free non-free-firmware
#deb-src http://deb.debian.org/debian bookworm-updates main contrib non-free non-free-firmware
```

```bash
sudo nala update && sudo nala upgrade && sudo apt full-upgrade
```
- NOTE: Here i killed the program, restarted the shell session after running `infocmp -x xterm-ghostty | ssh 192.168.120.15 -- tic -x -`. Then installed `btop` (`sudo nala install btop`) and re-ran the command
- NOTE 2: I ended up killing the program multiple times and just running via `apt` instead of nala. Seems there are some things that nala can't handle that well.

Due to having to kill nala...
```bash
sudo dpkg --configure -a
sudo apt install -f
```
were run 2 times to try to fix it. Then (with help of AI) input message:
```
dpkg: error processing archive /var/cache/apt/archives/libgtk-3-0t64_3.24.49-3_arm64.deb (--unpack):
 trying to overwrite '/usr/lib/aarch64-linux-gnu/gtk-3.0/3.0.0/immodules/im-am-et.so', which is also in package libgtk-3-0:arm64 (1:3.24.38-2~deb12u2+rpt7+rpi1)
dpkg-deb: error: paste subprocess was killed by signal (Broken pipe)
```

```bash
sudo dpkg -i --force-overwrite /var/cache/apt/archives/libgtk-3-0t64_3.24.49-3_arm64.deb
sudo apt --fix-broken install
```
were run.

And a couple more checks of `dpkg --configure -a`, `nala update/upgrade` later..

## 5. Reboot
Nala did say...
```
Notice: The following packages require a reboot.
  dbus
```
so
```bash
sudo shutdown -r 0
```
it is then.

## 6. Install qbittorrent-nox (v5.1)
This is a way to test debian 13 and something i needed (hence why i installed deb 13)

## 7. Sleep (backups are inexcessible anyway)

## 8. Start up
Enable rpi-connect by signing in.

## 9. Install wayfire
https://github.com/WayfireWM/wayfire

```bash
git clone https://github.com/WayfireWM/wf-install
cd wf-install

./install.sh --prefix /opt/wayfire --stream 0.8.x
```

```bash
# Dependiences install after the original install broke
sudo apt install git meson python3-pip pkg-config libwayland-dev autoconf libtool libffi-dev libxml2-dev libegl1-mesa-dev libgles2-mesa-dev libgbm-dev libinput-dev libxkbcommon-dev libpixman-1-dev \
xutils-dev xcb-proto python3-xcbgen libcairo2-dev libglm-dev libjpeg-dev libgtkmm-3.0-dev xwayland libdrm-dev libgirepository1.0-dev libsystemd-dev policykit-1 libx11-xcb-dev libxcb-xinput-dev \
libxcb-composite0-dev xwayland libasound2-dev libpulse-dev libseat-dev valac libdbusmenu-gtk3-dev libxkbregistry-dev libdisplay-info-dev hwdata
```

```bash
# Didn't need to do anything fancy... oh well.
sudo nala install wayfire
```

Copy https://github.com/WayfireWM/wayfire/blob/master/wayfire.ini to `.config/wayfire.ini`
Remove old folder
```bash
rm -rf wf-install/
```

Reboot
```bash
sudo shutdown -r 0
```
Do some stuff in `raspi-config` (change display compositor to wayfire, boot to desktop via `1 -> boot`) and restart.

Switch over to `LABWC` instead...

Remove watfire
```bash
sudo nala remove wayfire
```


## 10. Recoving "lost" data

### 10.1: Copy home dir
This contains a lot of data, so lets copy that across first.
```bash
sudo mount /media/backup
sudo monut /dev/nvme0n1p2 /mnt/nvme_root

cd /media/backup/PiRecovery
cp -a home /mnt/nvme_root/
```

### 10.2: Boot back into nvme

### 10.3: Install zsh
```bash
sudo nala install zsh
chsh -s $(which zsh)
```

### 10.4: Fix ssh
```zsh
ssh-keygen -f '/home/pi/.ssh/known_hosts' -R '192.168.120.15'
```

### 10.5: Boot back into sd-card

### 10.6: Copy other important files across
```bash
# after mounting
cd /media/backup/PiRecovery/nvme_root
sudo cp var/lib/mysql/ -a /mnt/nvme_root/var/lib/
sudo cp var/www/ -a /mnt/nvme_root/var/
sudo cp -a etc/apache2/ /mnt/nvme_root/etc
```

### 10.7: boot into nvme

### 10.8: Recreate users
```zsh
sudo useradd -m -d /home/git -s /bin/zsh git
sudo passwd git
sudo chown -R git:git /home/git
sudo useradd -m -d /home/wp -s /bin/zsh wp
sudo passwd wp
sudo chown -R wp:wp /home/wp
sudo useradd -m -d /home/qbtuser -s /bin/zsh qbtuser
sudo passwd qbtuser
sudo chown -R qbtuser:qbtuser /home/qbtuser
```

## 11: Installing gitea

### 11.1: Install database server.
```zsh
sudo nala install mariadb-server
```

### 11.2: Reboot into sd-card, copy, and back into nvme.
```bash
# after mount + chdir
sudo cp -a etc/mysql /mnt/nvme_root/etc/
```
This step was done so that i could have remote connection set up again without having to remember which files i edited...
(I use beekeeper as my database manager)

### 11.3: Install gitea
```zsh
wget -O gitea https://dl.gitea.com/gitea/1.24.2/gitea-1.24.2-linux-arm64
chmod +x ./gitea
```

### 11.4: Sd-card jumping
```bash
sudo cp -a var/lib/gitea /mnt/nvme_root/var/lib

# These were other i knew i needed and might as well copy across whilst i'm here.
sudo cp -a var/lib/apache2 /mnt/nvme_root/var/lib
sudo cp -a var/lib/docker /mnt/nvme_root/var/lib
sudo cp -a var/lib/php /mnt/nvme_root/var/lib
sudo cp -a var/lib/phpmyadmin /mnt/nvme_root/var/lib
```

### 11.5: Setting up gitea
```zsh
sudo chown git:git /var/lib/gitea
sudo chmod -R 750 /var/lib/gitea
```

#### 11.5.1: jump
```bash
sudo cp -a etc/apache2/ /mnt/nvme_root/etc/
sudo cp -a etc/gitea/ /mnt/nvme_root/etc/
sudo cp -a etc/php/ /mnt/nvme_root/etc/
sudo cp -a etc/phpmyadmin/ /mnt/nvme_root/etc/
```

#### 11.5.2: Back at it.
```zsh
sudo chown root:git /etc/gitea
sudo chmod 770 /etc/gitea
sudo mv gitea /usr/local/bin/gitea
```
https://raw.githubusercontent.com/go-gitea/gitea/main/contrib/autocompletion/zsh_autocomplete -> `/usr/share/zsh/_gitea`

#### 11.5.3: Copy from ds to nvme (via sd)
```zsh
sudo cp -a etc/systemd/system/act_runner.service /mnt/nvme_root/etc/systemd/system
sudo cp -a etc/systemd/system/bouncy_bot.service /mnt/nvme_root/etc/systemd/system
sudo cp -a etc/systemd/system/gitea.service /mnt/nvme_root/etc/systemd/system
```

#### 11.5.4: Back to gitea
```zsh
sudo systemctl enable gitea.service
# Created symlink '/etc/systemd/system/multi-user.target.wants/gitea.service' → '/etc/systemd/system/gitea.service'.
sudo systemctl start gitea.service
sudo chown -R git:git /var/lib/gitea
```

### 11.6: Setting up act-runner
```zsh
wget https://gitea.com/gitea/act_runner/releases/download/v0.2.12/act_runner-0.2.12-linux-arm-6
sudo chmod +x ./act_runner-0.2.12-linux-arm-6
./act_runner-0.2.12-linux-arm-6 --version
mv ./act_runner-0.2.12-linux-arm-6 ./act_runner
sudo mv ./act_runner /home/git
sudo systemctl start act_runner.service
# ● act_runner.service - Gitea Actions runner
#     Loaded: loaded (/etc/systemd/system/act_runner.service; disabled; preset: enabled)
#     Active: activating (auto-restart) (Result: exit-code) since Sun 2025-06-29 11:11:58 BST; 3s ago
# Invocation: 11798babc75b4d6db8b3590d3d272add
#       Docs: https://gitea.com/gitea/act_runner
#    Process: 4904 ExecStart=/home/git/act_runner daemon --config /home/git/act_config.yaml (code=exited, status=1/FAILURE)
#   Main PID: 4904 (code=exited, status=1/FAILURE)
#        CPU: 18ms
sudo journalctl /home/git/act_runner
# Jun 29 11:11:58 raspberrypi act_runner[4904]: time="2025-06-29T11:11:58+01:00" level=info msg="Starting runner daemon"
# Jun 29 11:11:58 raspberrypi act_runner[4904]: Error: daemon Docker Engine socket not found and docker_host config was invalid
# Jun 29 11:12:18 raspberrypi act_runner[4948]: time="2025-06-29T11:12:18+01:00" level=info msg="Starting runner daemon"
# Jun 29 11:12:18 raspberrypi act_runner[4948]: Error: daemon Docker Engine socket not found and docker_host config was invalid
# Jun 29 11:12:28 raspberrypi act_runner[4964]: time="2025-06-29T11:12:28+01:00" level=info msg="Starting runner daemon"
# Jun 29 11:12:28 raspberrypi act_runner[4964]: Error: daemon Docker Engine socket not found and docker_host config was invalid
# Jun 29 11:12:39 raspberrypi act_runner[4980]: time="2025-06-29T11:12:39+01:00" level=info msg="Starting runner daemon"
# Jun 29 11:12:39 raspberrypi act_runner[4980]: Error: daemon Docker Engine socket not found and docker_host config was invalid
# Jun 29 11:12:49 raspberrypi act_runner[4997]: time="2025-06-29T11:12:49+01:00" level=info msg="Starting runner daemon"
# Jun 29 11:12:49 raspberrypi act_runner[4997]: Error: daemon Docker Engine socket not found and docker_host config was invalid

su git
cd ~

gitea --config /etc/gitea/app.ini actions generate-runner-token
# 4E7C6L7iTR0Ekko5TeLAUfXVdu1K4If3JZZH2cpT
./act_runner register
# INFO Registering runner, arch=arm, os=linux, version=v0.2.12.
# WARN Runner in user-mode.
# INFO Runner is already registered, overwrite local config? [y/N]
# y
# INFO Enter the Gitea instance URL (for example, https://gitea.com/):
# http://192.168.120.15:3000/
# INFO Enter the runner token:
# 4E7C6L7iTR0Ekko5TeLAUfXVdu1K4If3JZZH2cpT
# INFO Enter the runner name (if set empty, use hostname: raspberrypi):
#
# INFO Enter the runner labels, leave blank to use the default labels (comma-separated, for example, ubuntu-latest:docker://docker.gitea.com/runner-images:ubuntu-latest):
# ubuntu-latest,ubuntu-22.04
# INFO Registering runner, name=raspberrypi, instance=http://192.168.120.15:3000/, labels=[ubuntu-latest ubuntu-22.04].
# DEBU Successfully pinged the Gitea instance server
# INFO Runner registered successfully.
```

### 11.7: Install docker
https://docs.docker.com/engine/install/debian/
```zsh
# Add Docker's official GPG key:
sudo apt-get update
sudo apt-get install ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/debian/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

# Add the repository to Apt sources:
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/debian \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
```

```zsh
sudo nala install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo rm /var/lib/docker -rf
sudo docker run hello-world
sudo systemctl restart docker
sudo docker run hello-world
sudo usermod -aG docker git
```

## 12: Setup qbittorrent
```zsh
qbittorrent-nox
```
Follow: https://github.com/qbittorrent/qBittorrent/wiki/Running-qBittorrent-without-X-server-(WebUI-only,-systemd-service-set-up,-Ubuntu-15.04-or-newer)
Most of the stuff was:
- Not set up already (hence this is a new setup pretty much)
- Done via the WebUI (Which is really easy to use)

## 13: Restart fan speed watcher
```zsh
sudo cp /media/backup/PiRecovery/nvme_root/var/spool/cron/crontabs/pi /var/spool/cron/crontabs/pi -a
crontab -e # This is so that cron fully updates as copying the file isn't enough.
sudo shutdown -r 0
```

## 14: Setup web server
```zsh
sudo nala update
sudo nala upgrade
sudo nala install apache2
sudo shutdown -r 0
sudo systemctl enable apache2
sudo systemctl start apache2
```

Follow https://serverfault.com/questions/6895/whats-the-best-way-of-handling-permissions-for-apache-2s-user-www-data-in-var for groups
```zsh
sudo groupadd www-pub
sudo groupadd www-data
sudo usermod -aG pi
sudo usermod -aG wp
/var/www/html/permissions.zsh
```

```zsh
# better cat
sudo nala install bat
```

```zsh
# File: /var/www/html/permissions.zsh
#!/bin/zsh
sudo chown -R www-data:www-pub /var/www
sudo chmod 2775 /var/www
sudo find /var/www -type d -exec chmod 2775 {} +
sudo find /var/www -type f -exec chmod 0664 {} +
sudo chmod +x /var/www/html/permissions.zsh

sudo touch /var/log/apache2/python_app.log
sudo chown www-data:www-data /var/log/apache2/python_app.log
sudo chmod 644 /var/log/apache2/python_app.log
```

```zsh
sudo a2enmod rewrite
sudo systemctl apache2 restart
```

NOTE: https://unix.stackexchange.com/questions/545629/unable-to-access-apache-webserver-from-local-home-network
Browser cache is fun...

### 15: Setup php + wp
```zsh
sudo nala install php
# Note: the below was not needed as i had already copied over wp
# su wp
# cd ~
# wget https://wordpress.org/latest.zip
# mkdir install-20250629
# mv latest.zip install-20250629
# cd install-20250629
# unzip latest.zip
sudo nala install php-mysql # Found via: https://stackoverflow.com/questions/35424982/how-can-i-enable-the-mysqli-extension-in-php-7#37083448
sudo shutdown -r 0 # easier way to reboot and reset rather than trying to find the system file to restart
```

### 16: Setup backups
```zsh
z /media/backup/PiRecovery/nvme_root/etc
sudo cp -a cron.hourly/backup /etc/cron.hourly
sudo nala install borgbackup
```

### Final notes
Things still broken:
- wayland desktop environment.
  This works with a fresh install, i don't exactly know the cause as to why yet. Either way, due to not using the desktop that often... i'm leaving this until i absolutely need to use the desktop.
  I have a feeling this happened due to overwrititng home dir in **10**. but i checked all the files and can't see anything obvious..

Things to note:
- Don't do stuff reclessly. At least it shouldn't take too long (not 3 days worth) to reset everything back up
- I did have backups, yet didn't use them (didn't think i would have THAT much detail stored in them... Pretty much had everything)

Categories: [hidden documentation Pi]
