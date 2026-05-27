# CSE 110 Group 15 Review

## Repository Setup:  
	The organization of the repository itself is very well put together and organized. Each segment of the repository is split between its most vital groupings upon inspection, such as splitting repositories between debugging, functions, source files and specs. Any added dependencies or any files that need to be ignored are clearly communicated in the package file that is also easily navigable from the root directory. 

## Source file/Main Content:   
	Organizing all functions into their own segment, as well as organizing all implementations regarding the actual visuals of the SitRep through the source file is able to let a reader easily understand what files are related to each other. All js files in the repository seem to also have clearly defined (or set up) comments that helps a reader go through each function and understand what is going on in each function. Any incomplete functions also have set up comments detailing what is to be done in that function as well, which helps new readers or implementers be able to follow and get started on implementing the function. 

## Documentation:  
	Documentation is very well organized being located in the adr directory underneath the specs section. Following a clear template that defines the context for the inclusion, what drove that decisions, considered and finalized decisions and consequences is fully able to guide a reader as to why this adr implementation was used and why it was a best suit for the current build. Not all areas of the code are very well-commented while others are pure code, so updating all segments to stay consistent would be beneficial. 

## Application:   
	As far as the application is concerned, after running npm run dev:pages I am able to access the application and open it. I am also able to safely view the login information. The login page has a neat info display signaling how many team members have checked in today. However, trying to create a new account or attempting to login only results in an error, meaning I am not able to access the application’s SitRep content fully at the moment.   
## Issues/Concerns:   
	Although a clear build-pipeline is established and does seem to work consistently in setting up commits, testing these commits, then pushing them in to create a build there does seem to be some confusion on my end as to how I would be able to actually run the build and test the actual result. Clearly detailing how to actively run the application in the ReadME.md file itself could be appreciated for a reader to be able to actually examine the application in action. Additionally, including a Github page to access the project could be something to look into.   

# CSE 110 Group 13 Review

## Repository Setup:  
	This repository is well organized and it is easy to see that this team has spent a lot of time on the project process. The sprint planning logs include the clear goals, the feature ownership, a definition of what is done, and etc. This helps the reader to understand what the team has planned to do and what problems they were thinking about. This team also has nine standup notes from May 5 to May 25, and the ADR files have followed the format required in the grading rubric. This successfully connects the decisions back to the team discussions. 

## Source file/Main Content:  
	One thing for this part could be better is the JSDoc coverage. Right now, only some of the files seems to have the JSDoc blocks, such as [auth.js](http://auth.js), but other files and functions such as the [blockers.js](http://blockers.js) do not seem to have the same amount of the comets. Since the documentation of the code is the part of the grading rubric, I would suggest that adding more comments to the rest of the js files would be helpful and make the code easier to read and debug later.

## Documentation:  
	One thing for this part is that I think maybe the standup meeting schedule could also be improved. The Week7 sprint plan says that the team is taking about two standups meetings per week, but the project asks us to have at least 3 standup meetings a week. Hence, I think regarding the rubric, we should have more sprint standup meetings per week, one note is that maybe having a fixed schedule like Tuesday and Thursday after class would be helpful, and make the sprint meeting easier to access, rather than schedule another time just for the meeting.

## CI/CD Pipeline:  
	I think for this part, you guys have done a really good job\! The CI/CD setup looks really good, in your repo you are using the lint, unit and E2E testing to connect to the Github Action and deployment. I really like your idea of using the E2E test as smoke tests, it really makes sense because the features are still changing. The changelogs are really easy to read, good job\! However, there is a small issue with release tags, the changelog in your repo has lists v0.1.0, v0.1.1 and v0.2.0. But there is no v0.2.0 tag in your github releases. Since the changelog is already clear, adding the missing tag would make the git history match the changelog better\!

## Summary of Area of Improvements:  
	Overall, this repo is in a good shape, the team have clear planning documentations, nice ADRs, standup notes and a clean changelog. I think the main things to improve will be adding more JSDoc comments, meeting the three standup meetings per week requirements on the grading rubric, and also please add the missing release tags. I believe these grounded changes would make the project more complete and hit the rubric better\!