# Original Discord
This is the original post of what i was going to put for the discord section. Fell free to read this even though its kinda useless now.

### The situation
I use [discord](https://discord.com) with the client modification [Vencord](https://vencord.dev). I also use Fedora Linux (so dnf package manager).
Nothing sounds wrong here right? Well when it comes to **updating** discord is where the issue occurs. (This most commonly happens on computer restarts).

In order to run discord, i have the `.tar.gz` version downloaded. Because:
- Vencord doesn't support snap store version of discord
- It's the only alternative discord has which i can run (can't really install `.deb` packages with fedora...)
- See [Flatpak Discord](#flatpak-discord) for information about the flatpak version.

Because of using the `.tar.gz` version, i believe that discord doesn't like update as it should do. So most of the time when i restart my computer without updating discord in a while, discord requires a manually update. <br>
Now a manually update doesn't sound that bad right, it's just download the files and extract them into the same directory. But then comes the issue of vencord.

This is not an issue with vencord and vencord can't do anything to help this (well they can, which i cover here: [vencord installer](#vencord-installer)).
I believe when discord auto updates, discord is only changing the files and bytes that discord needs to change to run. However when discord is updated by replacing all the files in the directory upon extracting the `.tar.gz` file.<br>
That replaces more data than what discord would otherwise do. Due to this and how vencord works. I believe that the vencord files/changes are being overwritten by the data from the `.tar.gz`.
As such, every time i install discord via the `.tar.gz` option, i also have to install vencord via their CLI installer.
However, the CLI installer has some annoyances. In order to install vencord:
1. Download it (1 command)
2. Give `sudo` permission (1 password)
3. Navigate to install vencord (1 enter)
4. Use custom location (1 enter)
5. Type in path (`/home/dragmine/Applications/Discord`)
6. Submit (1 enter)

So overall, it's not a long process which takes a couple of seconds to do. The problem is how often i have to do it. So now actually onto the interesting part.
In total:
- Discord download (open in browser and save).
- Vencord install (1 command, 1 password, 4 enter, 1 path)

### The interesting part
In order to automate updating discord there are two important things.
1. Download and extract
2. Update vencord

#### Part 1: Downloading and extracting discord
Upon submitting the request to download manually, discord opens up at this link: `https://discord.com/api/download/stable?platform=linux&format=tar.gz`. <br>
Using curl gives this joyful response:
```html preview title="Curl response"
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 3.2 Final//EN">
<title>Redirecting...</title>
<h1>Redirecting...</h1>
<p>You should be redirected automatically to target URL: <a href="https://stable.dl2.discordapp.net/apps/linux/0.0.76/discord-0.0.76.tar.gz">https://stable.dl2.discordapp.net/apps/linux/0.0.76/discord-0.0.76.tar.gz</a>.  If not click the link.%
```
I would have used the link provided by this redirect (`https://stable.dl2.discordapp.net/apps/linux/0.0.76/discord-0.0.76.tar.gz`) but this link contains a specific version.[^1] <br>
After finding the option to allow redirects `-L`, the binary file was downloaded. Simple

Extracting took a quick research (zip file is just unzip but tar.gz is something different).
But overall really easy (expect for one tiny bit which is covered here [Variables](#script-variables))

[^1]: Discord why are you still on v0.0.x anyway? I'm surprised you haven't moved onto v0.1.x yet...

#### Part 2: Vencord
Vencord required a tiny bit of looking through code. <br>
The command on the website is: `sh -c "$(curl -sS https://raw.githubusercontent.com/Vendicated/VencordInstaller/main/install.sh)"`. Which works perfectly for most cases.
I could have used this command to get the installed but the command wants `sudo` permission. Which makes sense, if discord is installed via flatpak or the system package manager.
However for a local install into my own Applications folder. `sudo` is not required. <br>

So after a brief digging in the file, this curl command was found
```sh
# Rest of script has been omitted
curl -sS https://github.com/Vendicated/VencordInstaller/releases/latest/download/VencordInstallerCli-Linux \
  --output "$outfile" \
  --location
```
Perfect i can just use that instead. Now comes the fun part.

#### Part 3: Working out inputs
The vencord installer requires human inputs, which I wanted to automate. <br>
After many attempts (which i won't go into detail). I finally arrived at this command:
```sh
(echo '\n'; sleep 0.1; echo '\n'; sleep 0.1; echo ~'/Applications/Discord'; echo '\n'; sleep 2;) | $DIR/vencord.sh
```
Without the sleeps, the terminal was doing stuff way too quickly for the program to keep up eventually causing a fatal error (due to a `^D`)

#### Part 4: Variables {#script-variables}
The variables `$DIR` took a bit to work out how to do (there isn't really much documentation on these things) but once sorted, the script is completed eventually leading to this:
```zsh
#!/bin/zsh

# Create temp dir to keep this all out of the way
DIR=`mktemp -d`
# echo "Made temp dir:" $DIR

# Get discord
echo "Downloading discord"
curl 'https://discord.com/api/download/stable?platform=linux&format=tar.gz' -L --output $DIR/discord.tar.gz
echo "Extracting Discord"
tar xf $DIR/discord.tar.gz -C ~/Applications/

# Get vencord
echo "Downloading Vencord"
curl 'https://github.com/Vendicated/VencordInstaller/releases/latest/download/VencordInstallerCli-Linux' -L --output $DIR/vencord.sh
chmod +x $DIR/vencord.sh

# Run installer
echo "Running Vencord"
# Sleep is required so that the program doesn't quit early or cause an error in the inputs.
(echo '\n'; sleep 0.1; echo '\n'; sleep 0.1; echo ~'/Applications/Discord'; echo '\n'; sleep 2;) | $DIR/vencord.sh
echo "Vencord installed!"

# Clean up is done automatically due to it being in a temp directory
echo ""
echo "Discord updated. Files used can be found in" $DIR ". (These will be deleted automatically due to being in /tmp)"
```
<sub><sup>The script above can also be found at this gist: [https://gist.github.com/dragmine149/078f7ee4d0f6d1833c80286f880650b4][https://gist.github.com/dragmine149/078f7ee4d0f6d1833c80286f880650b4]</sup></sub>

The variable `$DIR` is where everything is temporary saved. Scripts can't really change the current working directory (cwd) and we don't really want to keep clogging up the cwd with unnecessary files. (Yes i know i could just remove them but...) <br>
Hence the use of the `/tmp` directory. <br>
The rest of the script, all the echos are there as an updater telling you what is going on.

### Why not flatpak discord {#flatpak-discord}
<sub><sup>Flatpak discord: [https://flathub.org/apps/com.discordapp.Discord](https://flathub.org/apps/com.discordapp.Discord)</sub></sup>
I only just discovered this as i'm writing this (went to vencord.dev to find confirm the reason for snap and found it).
Well, put simply. I can't be bothered to switch now and from reading the flatpak description, some feature (which are optional) are disabled.

### Vencord Installer {#vencord-installer}
The vencord installer is annoying for two reasons:
1. Sudo is required. (You can't even run the command `sh -c "$(curl -sS https://raw.githubusercontent.com/Vendicated/VencordInstaller/main/install.sh)"` with sudo)
2. The whole path is required. The installer doesn't understand `~/Applications/Discord` as being `$USER/Applications/Discord` (`$USER` being the path to your home directory, in my case `/home/dragmine`)

Have i submitted a request about these annoyances, well no.
1. Using root by default is confusing
Apparently they plan to rewrite the installer so it doesn't require root, but for the time being root is needed for most of the stuff. See: https://github.com/Vencord/Installer/issues/143
2. This normally has an issue to do with processing strings and idk if it's possible to fix it in go.
