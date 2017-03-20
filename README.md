# graphfes
GraphFES for Moodle

# Authors
GraphFES is a free open source Moodle plug-in and node application for extraction of information from Moodle message boards and generation of graphs using that information.
GraphFES is a project started by TIGE-UPM, and developed by Ignacio Suárez-Navas (ISN) and Dr. Ángel Hernández-García (AHG)

# Project log

v.0.1. GraphFES for Moodle 2.8/2.9 (ISN/AHG). Initial version.
v.0.2. GraphFES for Moodle 3.0/3.1 (AHG). Added support for Moodle 3 and bug correction. Uploaded to GitHub.

# Installation
1. Activate local plug-in in Moodle (tested: 2.8/2.9/3.0/3.1)
  a) Log in as Moodle Admin
  b) Go to Site Administration►Plugins►Installplugins
  c) Install plugin from the attached ZIP file (from “Moodle\graphfes.zip”). Choose plugin type: local plugin. Check acknowledgement and continue.

2. Enable web services
  a) Go to Site Administration►Advanced features
  b) Check “Enable web services” and save

3. Enable REST protocol.
  a) Go to Site administration►Plugins►Web services►Manage protocols
  b) Enable REST protocol
  
4. Web service creation.
  a) Go to Site administration►Plugins►Web services►External services
  b) Click “Add”, and type the web service name (e.g. “GraphFES”)
  c) Configure permissions (use your own access policies).
  
5. Add functions to the web service.
  a) Go to Site administration►Plugins►Web services►External services
  b) In the web service created in step 4, click on Functions, then “Add functions”
  c) Add the following functions:
    i.   core_course_get_courses
    ii.  core_enrol_get_enrolled_users
    iii. mod_forum_get_forums_by_courses
    iv.  mod_forum_get_forum_discussion_posts
    v.   local_graphFES_reportAll
    vi.  local_graphFES_reportAllLegacy
    
6. Generate tokens for users.
  a) Go to Site administration►Plugins►Web services►Manage tokens
  b) Click “Add”
  c) Complete username, service name and expiry date (“Valid until”).
  
7. GraphFES App
  a) Install node.js (from https://nodejs.org/en/download)
  b) Copy the contents of the folder “Node” to hard drive (recommended: “C:\”, “E:\”, etc.).
  c) Open a command prompt (cmd.exe) and run node: e.g. “node C:\GraphFES\app\app.js”.
  d) Leave command window “Listening at port 3000” open.
  
# Running GraphFES

1. Open http://localhost:3000
2. Enter URL of your Moodle installation, username, password and web service (from step 4.b).
3. Choose course to extract data from and click “Send”.
4. Wait for the app to process the data.
5. Download the generated datasets for use in Gephi.
6. (Optional) When done, stop Node.js (Ctrl+C in the command window, and close)
7. Process and analyze the data files in Gephi
