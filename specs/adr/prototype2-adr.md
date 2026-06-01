# Title: Prototype 2 Implementation

**Status**: Approved

**Author**: 

**Context**: 
    After meeting with Professor Powell during office hours and discussing the architecture of our project, our team decided prototype 1 contained too many external dependencies and was not modular enough. For prototype 2, our aim was to remove as many dependencies as possible and to modularize our code for easier code management. 

**Considered Options**: 
1. Singular file containing the bulk of app's functionality
   1. Pros: Less coordination and imports between parts of project
   2. Cons: Extremely hard to read and reason about while debugging
2. Separating logic into modules
   
**Chosen Decision**: Modules

**Rationale**: 
Modularization is standard practice and for good reason. It aids the management of code and makes for a clean and organized project structure. Regarding the dependencies, our reasoning was that relying on too many outside functionality puts our project in a vulnerable position, where a failure in any one of these dependencies extends to our application.  

**Consequences**: 
Refactoring our entire project was necessary, but prototype 1 was only a prototype and we expected to have to make major changes at this stage of development. 