![](https://github.com/cr-ste-justine/score-auth/workflows/Build/badge.svg)
![](https://github.com/cr-ste-justine/score-auth/workflows/Publish/badge.svg)

# About

This is a reverse-proxy that operates in from of the Score service.

Its main purpose is to perform custom authentication and access control outside of the Score codebase.

Other simple adaptations are acceptable, although anything that is very project-specific (ie, access to databases) should be moved to an external service so that this reverse-proxy can remain applicable across projets.

All requests to the Score service should pass through this reverse-proxy first.