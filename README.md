# currentactivity
> A command line tool to display the current activity for android

## Feature
1. show current window package name and activity name.
2. show current display activity stack.
3. show current display fragments in focused activity.

## Installation

```
npm install -g currentactivity
```

## Preamble

To use this cli tool, you need to install [adb](https://developer.android.com/studio/command-line/adb) first. If If you are using Mac OS, you can use homebrew to install adb.

```
brew install android-platform-tools
```

## Usage
### Show current activity's name
```
currentactivity -a
```
output example
```
com.tencent.mm/com.tencent.mm.ui.LauncherUI
```
### Show current activity's name in real time
```
currentactivity -a -w
```
### Show current activity's stack
```
currentactivity -s
```
output example
```
╔═══════════════════════════════════════════════════════════════╗
║ com.tencent.mm/.plugin.webview.ui.tools.WebViewUI             ║
╟───────────────────────────────────────────────────────────────╢
║ com.tencent.mm/.plugin.brandservice.ui.timeline.BizTimeLineUI ║
╟───────────────────────────────────────────────────────────────╢
║ com.tencent.mm/.ui.LauncherUI                                 ║
╚═══════════════════════════════════════════════════════════════╝
```
### Show current activity's fragments
```
currentactivity -f
```
output example
```
╔═════════════════════╤════════════════════════════════════════════════════════════════════════════════════════╗
║ activity            │ com.tencent.mm/.ui.LauncherUI                                                          ║
╟─────────────────────┼────────────────────────────────────────────────────────────────────────────────────────╢
║ framework fragments │ └─ #0: ad{d7a01e4 #0 androidx.lifecycle.LifecycleDispatcher.report_fragment_tag}       ║
║                     │                                                                                        ║
╟─────────────────────┼────────────────────────────────────────────────────────────────────────────────────────╢
║ androidx fragments  │ ├─ MainUI{403dae2} (f74366df-8aa6-4cc2-b702-9b609620a895 id=0x7f092d4a)                ║
║                     │ ├─ MvvmAddressUIFragment{ef218ab} (fbc006c7-be02-47fa-be40-952dcc42293b id=0x7f092d4a) ║
║                     │ ├─ MoreTabUI{dcc2cc6} (106e8aa9-d6da-48f2-b870-d0a95882d33f id=0x7f092d4a)             ║
║                     │ ├─ ChattingUIFragment{cad8b94} (3fccfb2c-fc14-4b3c-8b91-ba9d3e102759 id=0x7f0909d7)    ║
║                     │ └─ FindMoreFriendsUI{fdacb08} (b1b80b1b-ea6f-470b-b16c-cd76c853e8ad id=0x7f092d4a)     ║
║                     │                                                                                        ║
╚═════════════════════╧════════════════════════════════════════════════════════════════════════════════════════╝
```
### Show all the info about the current activity
```
currentactivity -A
```
output example
```
╔═════════════════════════════════════════════╗
║               current window                ║
╟─────────────────────────────────────────────╢
║ com.tencent.mm/com.tencent.mm.ui.LauncherUI ║
╚═════════════════════════════════════════════╝



╔═══════════════════════════════╗
║        activity stack         ║
╟───────────────────────────────╢
║ com.tencent.mm/.ui.LauncherUI ║
╚═══════════════════════════════╝



╔══════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║                                                  fragments                                                   ║
╟─────────────────────┬────────────────────────────────────────────────────────────────────────────────────────╢
║ framework fragments │ └─ #0: ad{d7a01e4 #0 androidx.lifecycle.LifecycleDispatcher.report_fragment_tag}       ║
║                     │                                                                                        ║
╟─────────────────────┼────────────────────────────────────────────────────────────────────────────────────────╢
║ androidx fragments  │ ├─ MainUI{403dae2} (f74366df-8aa6-4cc2-b702-9b609620a895 id=0x7f092d4a)                ║
║                     │ ├─ MvvmAddressUIFragment{ef218ab} (fbc006c7-be02-47fa-be40-952dcc42293b id=0x7f092d4a) ║
║                     │ ├─ MoreTabUI{dcc2cc6} (106e8aa9-d6da-48f2-b870-d0a95882d33f id=0x7f092d4a)             ║
║                     │ ├─ ChattingUIFragment{cad8b94} (3fccfb2c-fc14-4b3c-8b91-ba9d3e102759 id=0x7f0909d7)    ║
║                     │ └─ FindMoreFriendsUI{fdacb08} (b1b80b1b-ea6f-470b-b16c-cd76c853e8ad id=0x7f092d4a)     ║
║                     │                                                                                        ║
╚═════════════════════╧════════════════════════════════════════════════════════════════════════════════════════╝
```
### More Options
```
-h, --help      Show help
-a, --activity  Show the current activity's name
-s, --stack     Show the current activity's stack
-f, --fragment  Show all fragments in the current activity
-w, --watch     Monitor activity or fragments changes in real time
-A, --all       Show all information, including the current activity name, activity stack and fragments
```
That's it.

## Changelog

* 1.0.2
  * Compatible with some Samsung phones 
  
* 1.0.1
  * Added more options for more flexible output

* 1.0.0
  * Initial version

## License

MIT

