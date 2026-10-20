# Bug log

Bugs found while building the Campus Parking System, how each one was found, what caused it, how it was fixed and how the fix was checked. Dates come from the git history (`git log`). "Test" means an automated test in `backend/src`; "by hand" means I tried it in a browser.

## A. Data and simulation

| ID | Date | What went wrong | Cause | Fix | Checked |
|---|---|---|---|---|---|
| B01 | 21 Sep | Gate capacities on the page did not match the campus. | The first capacities were placeholder numbers. | Replaced them with the real numbers (487, 239, 101, 60, 281). `setup.js` now corrects them on every start. | By hand |
| B02 | 21 Sep | Existing violations had no `notificationSent` column after the deploy. | A column was added to the model but the live table was not changed. | `setup.js` adds missing columns safely (`addColumnIfMissing`) and can be run again. | By hand on the deployed site |
| B03 | 23 Sep | Owners could not be notified because violations were not linked to a real registered plate. | The notification only looked at a made-up flag. | Resolving a violation looks up the registered owner by plate and shows the real contact. | Test (`adminRoutes.test.js`) |
| B04 | 13 Oct | The simulated car parks were busiest at night in New Zealand and "unpaid during paid hours" was flagged at night. | "Paid hours" used the server clock, which is UTC on Railway. | Paid hours are worked out in Pacific/Auckland time (`utils/nzTime.js`). | 6 tests, including the change of daylight-saving time |
| B05 | 13 Oct | Every weekday looked the same and every gate behaved the same, so the busy-times chart told nothing. | The generator picked a random gate and used one fixed rate. | Each gate and weekday has its own pattern, with a small random difference for each date (`simulationConfig.js`). | Tests in `typicalDay.test.js` |
| B06 | 13 Oct | Free spaces showed **-11** at Gate 3B. | The random demo violations were counted as parked cars, and pressing Update added more each time. | Demo violations no longer count as parked cars. Occupancy is limited to the number of spaces, and extra cars are released early (`enforceCapacity`). | Tests, and a local run with 80 extra cars in a 60-space gate |
| B07 | 13 Oct | About 1,700 open violations, far too many to be useful. | One car in six produced a violation. | Violations are rare (about 1 car in 100) and the open list keeps the newest 19 detections. | Tests, and the live list |
| B08 | 13 Oct | Reading occupancy got slower as data grew. | Every request read all parking events ever stored. | Only the last few hours of events are read. | By hand, response time |

## B. Pages and interface

| ID | Date | What went wrong | Cause | Fix | Checked |
|---|---|---|---|---|---|
| B09 | 24 Aug | Buttons on the register page looked wrong. | A CSS rule was too general and overrode the button style. | A more specific selector. | By hand |
| B10 | 25 Sep | Some "Open in Google Maps" links went to the wrong place. | The search words had not been checked. | Checked each gate against Google Maps and used the right landmark. | By hand |
| B11 | 2 Oct | Gate map highlights spilled past the car park (Gate 10), covered only part of the lot (Gate 3A) or hid the lot under the P icon (Gate 3B). | The colour fill leaked into similar-looking areas. | Filled inside a small box around each lot, with extra start points, and cut the result to a shape. | By hand, zoomed in |
| B12 | 3 Oct | Map thumbnails cut off the car parks. | A fixed-height crop. | The whole map is shown. | By hand |
| B13 | 5 Oct | The forecast chart looked like a flat line. | The vertical axis started at zero. | The axis fits the data and has whole-number ticks. | By hand |
| B14 | 13 Oct | The forecast page was too technical for a visitor. | It showed algorithm names and two competing numbers. | Rebuilt as a plain status plus a typical-day chart. The forecast moved into a collapsed section. | By hand |
| B15 | 13 Oct | The busy-times grid was wider than a phone screen. | A grid column could not shrink below its chart. | `minmax(0, 1fr)` columns. | By hand at 390 px wide |
| B16 | 13 Oct | The busy-times page showed "Could not load" and stayed that way after the server restarted. | One failed request stopped the page and nothing tried again. | Each request is handled separately and failed ones are retried every 5 seconds. | By hand: stopped and restarted the server |
| B17 | 13 Oct | New violations did not appear until the page was reloaded. | The admin and My vehicle pages loaded once. | They refresh by themselves (every 10 and 15 seconds), and pause while a form is open. | By hand |
| B18 | 13 Oct | The admin page downloaded every violation and showed the oldest first. | The list had no limit and no filter. | The server returns only the newest 100, with Open and Handled tabs and separate totals. | Tests |
| B19 | 13 Oct | Gate 1's map highlighted only one of its car parks. | Two more car parks on the map were missed. | Highlighted them too. | By hand |

## C. Accounts and the assistant

| ID | Date | What went wrong | Cause | Fix | Checked |
|---|---|---|---|---|---|
| B20 | 10 Oct | Two accounts could register the same plate, and wrong emails or phone numbers were accepted. | No uniqueness or format checks. | A unique index, format checks, and 409 for duplicates. | Tests (`authRoutes.test.js`) |
| B21 | 4 Oct | The assistant failed for new users. | The model I first chose (`gemini-2.5-flash-lite`) was no longer offered. | Found a working model by a real test call and made it a setting. | A live call |
| B22 | 4 Oct | Risk found at design time: a chatbot can make up answers. | Nothing limited what it could say. | It answers only from a fact sheet, never guesses prices, and is rate limited. | Tests (`assistantRoutes.test.js`) |
| B23 | 13 Oct | The assistant said it did not know the fees. | The fact sheet had no prices. | Added the official fees from the university website ($3 a day, $9 a week, $90 a trimester). | A live call |

## D. Testing and deployment

| ID | Date | What went wrong | Cause | Fix | Checked |
|---|---|---|---|---|---|
| B24 | 17 Sep | The site dropped offline several times. | Free hosting has limits and can sleep. | Frontend on Vercel, API and database on Railway. | By hand |
| B25 | Oct | A stray Vercel project was created. | I deployed from the wrong folder. | Deleted it, and always deploy with `--cwd`. | `vercel project ls` |
| B26 | 4 Oct | The new setting was not used after setting it on Railway. | The variable was staged, not deployed. | Deployed it from the dashboard. | A live call |
| B27 | 13 Oct | Tests sometimes failed by themselves. | Test files ran at the same time and changed each other's rows in one database. | `npm test` runs one file at a time. | Nine full runs in a row |
| B28 | 20 Oct | The live site had no data. | The free Railway trial ended and the API and database were switched off. | Not fixed by code. The system runs locally from the README, and screenshots were taken from a local run. | `railway status` |

## E. Found by the security tests (21 Oct)

I wrote `routes/security.test.js` and read the routes with an attacker in mind. These problems turned up.

| ID | What went wrong | Cause | Fix | Checked |
|---|---|---|---|---|
| S01 | Asking for the occupancy of a gate that does not exist crashed with a 500. | The code read a field of a missing gate. | It returns 404. | Test |
| S02 | `/api/gates/1abc/occupancy` showed gate 1. | MySQL quietly reads "1abc" as the number 1. | Ids must be whole numbers, otherwise 404 (gates and violations). | Test with `1abc`, `1 OR 1=1`, `-1`, `1e0` |
| S03 | Anyone could try unlimited passwords. | No limit on login. | 10 wrong tries per 15 minutes per address gives 429. Successful logins are not counted. | Test |
| S04 | Any website could call the API from a browser. | CORS allowed every origin. | Only the deployed site and localhost are allowed (`CORS_ORIGINS` can change this). | Test |
| S05 | A one-letter password could be registered. | No minimum length. | At least 6 characters, on the server and in the form. | Test |
| S06 | Unknown addresses and server errors returned Express's default HTML pages. | No handlers at the end of the chain. | JSON 404, 400 for broken JSON, 413 for large bodies, and a 500 that keeps the cause in the log only. | 4 tests |
| S07 | Every response said `X-Powered-By: Express`. | Express default. | Removed, and `X-Content-Type-Options: nosniff` added. | Test |

Checked and found fine: SQL in the login and plate fields, query operators sent as objects, SQL in a query string, edited tokens, tokens with no signature, expired tokens, tokens signed with another secret, asking for the admin role when registering, extra fields in a profile update, passwords never returned, the same answer for a wrong user name and a wrong password, and HTML in a stored question (it is stored and returned as plain text, and React shows it as text).
