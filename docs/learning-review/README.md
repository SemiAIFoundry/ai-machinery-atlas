# Review the connected-learning candidate

Start with the [facilitator guide](LEARNER-REVIEW-KIT.md), then use the [participant tasks](participant-task-scripts.md), [device and accessibility checklist](device-and-accessibility-checklist.md), and [observation template](observation-template.md). The [launch gates](launch-gates.md) distinguish completed implementation from evidence still needed.

The user is coordinating physical iOS/Android devices and 6–9 learners. No physical-device, assistive-technology, specialist or learner outcome has been recorded yet. The [browser and automated verification record](CANDIDATE-VALIDATION.md) covers only checks actually performed on this candidate.

Use a separately served candidate build for sessions, and record its `build-info.json`. The public demo still serves the released reference edition. Scenario fixtures and written responses belong to the reviewed candidate's declared content, check and model versions.

For a ready static archive, serve its extracted directory over HTTP. To test on devices sharing a trusted local network, run `python3 -m http.server 3115 --bind 0.0.0.0 --directory <extracted-static-directory>` on the host computer, then open `http://<host-LAN-IP>:3115/` on the device. Stop the server after review. Keep participant responses local or in a private collection; the app needs no account. For an Internet-accessible review, publish the static archive at a separate preview URL and retain the same build identity.
