# Dr. FixBoi®’s Structurally Sound

Teaching you things you don't really need to know but here we are.

A self-paced, unofficial study app for introductory architectural structures.
Start with math and load paths, then work through equilibrium, beam and
truss analysis, and member selection. Each workshop follows a problem
through drawing decisions, calculations, and checks with Val. Short
refreshers open in place, and the beam workshop includes interactive
shear and moment plotting. The exam studio offers independent practice
and a cumulative study guide.

Use the language selector to study in English, Spanish, French, or Brazilian
Portuguese. The app keeps your progress in the same browser across languages.
You can share a lesson link with `?lang=es`, `?lang=fr`, or `?lang=pt-BR` before
its `#workshop-…` fragment.

Completed steps and their drawings stay in the lesson. You can scroll back
through the solution, or use **Print lesson** at the end to print it or save it
as a PDF. Practice includes worked drawings and free-body diagram exercises.
On the home page, Val’s WebGL model turns as you move the pointer. Val’s glass
turns gold as you complete the steps in the learning path. A rendered portrait
is available when the browser cannot run WebGL 2.

## Run locally

Open `index.html` in a browser from the checkout. Keep the `src` folder
alongside it. The app runs without an installation, account, or server.
Progress is saved in the current browser.

## Update translations

English source messages live next to the lessons and interface. Add the
same key to `src/i18n/es.js`, `src/i18n/fr.js`, and `src/i18n/pt-BR.js` when
changing copy.
In a translated template, keep placeholders such as `{0}` and `{1}` for
the original values. They can appear in a different order to fit the sentence.

The home page loads a subset of Three.js r181 from `src/vendor` when it
renders Val. The vendor directory includes the upstream MIT license.

The steel profile reference contains selected CISC wide-flange properties.
The diagrams and member checks are for structural analysis practice.

## Further reading

- [Engineering Statics — Free-body diagrams](https://engineeringstatics.org/Chapter_05-free-body-diagrams.html)
- [Engineering Statics — Graphical shear and moment diagrams](https://engineeringstatics.org/graphical_method.html)
- [Engineering Statics — Method of joints](https://engineeringstatics.org/method-of-joints.html)
- [MIT OpenCourseWare — Engineering Mechanics I](https://ocw.mit.edu/courses/1-050-engineering-mechanics-i-fall-2007/pages/lecture-notes/)
