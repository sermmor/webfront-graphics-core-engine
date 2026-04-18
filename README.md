---
title: Development Handbook
---

// TODO: https://mrlinxed.com/blog/pixijs-setup-with-vite-and-typescript

## 1. Introduction
A graphic engine in Typescript for front-end applications. The key idea is control divs with canvas that contains graphics applications (canvas) in an easy way. So this graphic engine use PixiJS, Pixi Particles and MatterJS, but for the user of this graphic engine don't need to know to use PixiJS, Pixi Particles nor MatterJS.

## 2. Motivation
PixiJS is usefull for efficient web graphics applications where you have a low machine resources, but when that applications are a little complex (like a roulette o a Keno) the code can be hard to understand. Other engines like Unity or Cocos Creator are easy to use with complex applications but its have a high cost in performance. So a engine above PixiJS with some ideas of current engines (component-based programing, an easy manages scenes, automatic autoscale, an efficient game loop,...) but adapted in what we need, it should be the optimum.

We divide this documentation in two sections: how to use the engine (section 3) and the engine documentation (section 4). To understand the following sections, you must have knowledge of Typescript and JSON. The section 3 requires basic knowledges of Typescript and JSON, but in the case of section 4 - the engine documentation - you should have advanced knowledges of Javascript like reflection, garbage collector or Javascript stack.

## 3. How using the engine
We divide this section in the JSON objects (scene json files, template json files, and particles json files), that contains all the game data needed, and the Typescript code that defined behaviours and all things that control, and link, the JSON files using the engine. The main idea is that you can have different scenes with different graphics, sprites or view, but with the same Typescript code and without any error (so the differences between a Deluxe or a Normal version of the game can be only the scene or only the paths of the graphics when we creating the game).

### 3.1 JSON files
There are three types of json files: scenes, particles and templates. All of them represents the data of the game. So we start with scenes, then particles and finally templates.

#### 3.1.1 Scenes
An graphics application can have or not templates or particles, but it must have an scene. Because scene represents the hierarchy structure of all the game objects inside a canvas: where place the game objects, if the game object have childrens of parent, what components have the gameobjects, what behaviours have the game object, or the references between them.

#### 3.1.1.1 GameConfiguration
The game configuration has parameters about the width, the height, the gravity or pools. The usually width and height to use is 690x388 (a resolution of 16:9, that its use all the vast number of laptop screens, screens for computers and televisions). In the pools definition we write "name of the pool": "number of elements in the pool:name of Game Object to pool", and the Game Object that define the pool element will be inside of the pool, so we could't see it in the scene if we don't call to the pool inside of a behaviour. An example of GameConfiguration:
```json
"gameConfiguration": {
    "width": 690,
    "height": 388,
    "gravity": -9.8,
    "pools": {
        "BallPool": "20:Ingame-Ball",
        "ResultBoxPool": "20:Result-Box"
    }
},
```

#### 3.1.1.2 GameObject
A GameObject is an object that we place in an scene before launch the scene (it created in a loading time). It can be a visual object, or not (for instance an controller or a sound game object). You can see a GameObject like an structure that contains components, where the only mandatory component is Transform (the rest are optionals). So, the mandatory propierties for a Game Objects are "isEnabled", the Transform Component and the name (placed in the JSON like a key of the object, for instance in "my-good-game-object": { "isEnabled": true, "transform": { ... } }, "my-good-game-object" is the name of the GameObject). Note this that all the GameObjects must have diferents names, I means, two GameObjects always must have diferents names (in fact inside a pool the GameObjects has the generic name and following an index in the name).

This concept provide us to use the modern component-based programing in our canvas application, like Unity, Unreal Engine or Cocos2D. It based in things like dependency injection of GameObjects and Components using a scene file, eficient and transparent use of game loop of components, components with a behaviour already defined (like put an sprite or text in the place of the GameObject), pools of game objects (you don't create and destroy 10.000 bullets, you only use 5 bullets that you enable it when you would need or disable it when you wouldn't, so the garbage collector don't excecute it all the time and the FPS flow is more constant), only create objects, constants and variables before the game runs, and more.

A simple example of GameObject:

```json
"TextBall": {
    "transform": {
        "position": {
            "x": 0,
            "y": 0,
            "z": -0.2076927
        },
        "scale": {
            "x": 1,
            "y": 1
        },
        "childrenObjects": []
    },
    "textComponent": {
        "textValue": "7",
        "fontSize": 14,
        "fontWeight": "bold",
        "fontFamily": "Josefin-Sans",
        "align": "center",
        "textBaseline": "center"
    },
    "isEnabled": true
},
```

You can see a textComponent in the TextBall object, that means that this object has a TextComponent. Don't worry if your don't understand the TextComponent, cause in the following subsections I explain every Component that you can use inside a GameObject, and after I dedicate a time to explain how the Pools works (that links the GameObject concept with the explained in GameConfiguration). 

#### 3.1.1.2.1 Transform
Transform Component defines two types of properties: the GameObject place in the hierarchy (I mean, if the GameObject has childrens contained in the list "childrenObjects"), and propierties of a GameObject that we can calculate with a transform matrix or with trigonometric functions (position, scale and rotation). Note that all the GameObjects will are automatic sorted in the scene by its layer number and in descending order, but in the scene file the parents GameObjects it should be always written __after__ than its childrens GameObject.
* Position property defines a vector in three dimensions (where z is the layer) where we place the GameObject. We will use the __z__ position for represent the layer in which we will place the GameObject, so two GameObjects with the same __z__ we will see it in the same layer. All the GameObjects will are automatic sorted in the scene by its layer number and in descending order (so, a big __z__ is behind respect a low __z__, for instance an GameObject with a image component and a __z = -0.2__ and a GameObject with a text component and a __z = -0.3__, it will cause that the image will be painted behind of the text). Because of the automatic scale of the canvas inside of the main div, the position is not in pixel pure value, it's always a pixel relative to the size of the GameConfiguration (you have to imagine where would be the GameObject in the width and height of the GameConfiguration).
* Scale property is a vector in two dimensions that scales the GameObject. The dimensions _x_ and _y_ are number from 0 to 1 to represent a reduced of the image, but always that the scale dimension is greater than 1, its represent an magnification of the image. So an image with a scale value of (0.5, 0.5) will be the size reduced to 4 times less than its original size (the 1/2 of the width and the 1/2 of the height). And an image with a scale value of (2, 2) will be the size magnified to 4 times more than its original size (two times the width and two times the height).
* Rotation property is optional and defines the rotation __in radians__ of the GameObject.
* The childrenObjects propierty defines a list with the names of the GameObjects that are sons of this GameObject in the hierarchy. You can see the hierarchy like the HTML tree, because it works in the same way: if an GameObject is son of other, the son GameObject inherit all the transform matrix properties (position, scale and rotation) from its parent. Note that in the scene file the parents GameObjects it should be always written __after__ than its childrens GameObject.

An example for a transform component without childrens:
```json
"transform": {
    "position": {
        "x": 0,
        "y": 0,
        "z": -0.2076927
    },
    "scale": {
        "x": 1,
        "y": 1
    },
    "rotation": 3.14,
    "childrenObjects": []
},
```

An example for a transform with childrens:
```json
"transform": {
    "position": {
        "x": 90,
        "y": 232,
        "z": 0
    },
    "scale": {
        "x": 0.3587424,
        "y": 0.3587424
    },
    "childrenObjects": [
        "Big-Show-Ball",
        "Counter-Ball-Indicator-Text"
    ]
},
```

#### 3.1.1.2.2 Sprite
Sprite component defines an image in the screen. The anchor of the GameObject will be the center of the image. If a GameObject have a sprite component, it mustn't have a text component, a particle component or a graphics component. The sprite component only have two properties:
* nameImage. It's the name of the image file.
* color. It's a color in rgba or hexadecimal with alpha that represent a color matrix shader for the image. For instance, if color is red, the image will be filled with a red hue. If color is white but with an alpha less than 1, the color of the image won't be changed but it will be transparent. If color is equals to (255,255,255,1), the image color and the alpha won't be changed. You can combine alpha values with color, too.
```json
"sprite": {
    "nameImage": "Keno-TV-Ball-Content-Art-Deco.svg",
    "color": "(255,255,255,1)"
},
```

#### 3.1.1.2.3 Text
Text component defines a text in the scene. The anchor of the GameObject will be the center of the text. If a GameObject have a text component, it mustn't have a sprite component, a particle component or a graphics component. This component will define a lot of text propierties, but, for now, we only use the following propierties:
* textValue. Text string value to show.
* fontSize. Size (in points) of the text.
* fontFamily. Font to use, it will be loaded automaticly by this engine.
* align. Horizontal alignment of the text in the component. Its values can be: 'left', 'center' or 'right'.
* fill. Color of the text (in hexadecimal o rgba), the alpha value it isn't used.
* opacity. Alpha transparency value of the text.
* fontWeight. The style of the text: 'normal', 'bold', 'bolder', 'lighter', and '100', '200', '300', '400', '500', '600', '700', 800' or '900'.
* textBaseline. The baseline of the text that is rendered.
```json
"textComponent": {
    "textValue": "77",
    "fontSize": 14,
    "fontFamily": "Josefin-Sans-Light",
    "align": "center",
    "textBaseline": "center",
    "opacity": 0.12,
    "fill": "#ffffff"
},
```

#### 3.1.1.2.4 Particles
Particle component ("particleList") defines a list of particle emiters placed in the same position in the scene. The anchor of the GameObject will be the upper left corner (cause in all the engines, except Unity, for draw particles the anchor is always the upper left corner). If a GameObject have a particle component, it mustn't have a sprite component, a graphic component or a text component.

Using particles and shaders is a wide field that only a few number of dedicated professionals to special effects (fx) can understand completely (you know, that holy grail that in jobs offers receive the name of "graphical-programmer" and he never response to the offer). I mean, you never going to understand all the functions of the particles (and when I say never is never), you won't never be able to make the ideal particle emiter configuration to use in the exactly moment (the same for shaders). So, I recomend you to use [the Pixi particle editor](https://pixijs.io/pixi-particles-editor/#pixieDust) testing the different options little by little until you have a solution that it's near to your expected results. This way you will makes a great useful particle emiters collection that give life to your game (confetti falling, coins falling, fireflies, fireworks, fire, rain,...).

Each particle emmiter in the list have the following propierties:
* startAtMilliseconds. Optional parameter. It's a delay (in milliseconds used by DeltaTime - equals in all machines) to show the particle emition (the particle emition is started but it's with alpha = 0 until startAtMilliseconds time is end). So, the real duration of particle emition will be equals to startAtMilliseconds value parameter plus duration value parameter.
* duration. Duration of the particle emition. When this time ends, the particle ends the emition.
* color. Matrix shader color for the particles. Color in rgba or hexadecimal. If is white and opaque (value equals to (255,255,255,1)), then the image will be opaque and with their original color.
* nameImages. Names of the images to load and used like particles.
* config. Name of the file with all the Pixi-Particles information needed to use by the particle emition (you will see how to write and use this configuration file in the section __3.1.2 Particle files__).
```json
"particleList": [
    {
        "startAtMilliseconds": 1200,
        "duration": 20000,
        "color": "(255,255,255,1)",
        "nameImages": ["Coin01.png", "Coin02.png", "Coin03.png"],
        "config": "raining-coins.json"
    },
    {
        "duration": 21200,
        "color": "(255,255,255,1)",
        "nameImages": ["confetti-blue.png", "confetti-green-dark.png", "confetti-purple.png", "confetti-blue-dark.png",
            "confetti-olive.png", "confetti-purple-clear.png", "confetti-blue-purple.png", "confetti-orange.png", "confetti-purple-dark.png",
            "confetti-blue-sky.png", "confetti-orange-clear.png", "confetti-red.png", "confetti-green.png", "confetti-pink.png",
            "confetti-red-dark.png", "confetti-green-clear.png", "confetti-pink-clear.png", "confetti-tortoise.png"],
        "config": "confetti.json"
    }
],
```

#### 3.1.1.2.5 Graphics
A graphic component defines shapes to draw in the canvas by the engine. You can draw rectangles, circles or a free shape formed by lines and/or arcs. The anchor of the GameObject will be the upper left corner (cause in all the engines, except Unity, for draw engine graphics the anchor is always the upper left corner). If a GameObject have a graphics component, it mustn't have a sprite component, a particle component or a text component. There are 4 types of graphics components: RectangleComponent, RoundedRectangleComponent, CircleComponent and FreestyleGraphicComponent. In some of them the position of the object will be equals to the vector position transform plus the position vector of the graphics component (that is cause we can need rotations of the graphics component in an axis diferent that the upper left corner). The commons propierties that we can use in each graphic component are:
* borderColor. It's an optional parammeter. Color (hexadecimal or rgba) of the border.
* backgroundColor. It's an optional parammeter. Color (hexadecimal or rgba) background of the parameter, if the graphics is a shape not closed, it will be close automatically.
* opacity. It's an optional parammeter (GameObject is opaque by default). Opacity/Transparency (from value 0 - transparent - to 1 - opaque) of the component.
* borderWidth. It's an optional parammeter (by default borderWidth = 1). Width of the border. It's value can be equals to 0 for shapes that doesn't have any border.

__RectangleComponent__. Draw a Rectangle in the screen. Propierties:
* x. Position in 'x' axis of the RectangleComponent. The 'x' position of the GameObject in the screen will be this 'x' value plus the 'x' value of the transform. The position 'x' is always place taking account the dimensions defined in GameConfiguration, never the real canvas size.
* y. Position in 'y' axis of the RectangleComponent. The 'y' position of the GameObject in the screen will be this 'y' value plus the 'y' value of the transform. The position 'y' is always place taking account the dimensions defined in GameConfiguration, never the real canvas size.
* width. Width of the rectangle to draw.
* height. Height of the rectangle to draw.
```json
"RectangleComponent": {
    "x": 22,
    "y": 7,
    "width": 200,
    "height": 100,
    "opacity": 0.5,
    "borderColor": "#ff0000"
},
```

__RoundedRectangleComponent__. Draw a Rectangle with round borders in the screen. It's have the same propierties of RectangleComponent and the propierty 'radius':
* radius. Radius of each rounded corner.
```json
"RoundedRectangleComponent": {
    "x": 2,
    "y": 60,
    "width": 100,
    "height": 50,
    "radius": 15
},
```

__CircleComponent__. Draw a circle in the screen. Propierties:
* x. Position in 'x' axis of the CircleComponent. The 'x' position of the GameObject in the screen will be this 'x' value plus the 'x' value of the transform. The position 'x' is always place taking account the dimensions defined in GameConfiguration, never the real canvas size.
* y. Position in 'y' axis of the CircleComponent. The 'y' position of the GameObject in the screen will be this 'y' value plus the 'y' value of the transform. The position 'y' is always place taking account the dimensions defined in GameConfiguration, never the real canvas size.
* radius. Radius of the circle. This radius is always used taking account the dimensions defined in GameConfiguration, never the real canvas size.
```json
"CircleComponent": {
    "x": 2,
    "y": 60,
    "radius": 15,
    "borderWidth": 0,
    "backgroundColor": "#ff00ff"
},
```

__FreestyleGraphicComponent__. Draw a shape formed by a list of lines and/or arcs in the screen. Propierties:
* allLines. The list of arcs (type Arc) and lines (type StraightLine) to draw.

Type StraightLine:
* xToDraw. Final position x of the line. The initial position x is the final position x of the last line or arc drawed (imagine that you are drawing lines without quit the pencil of the paper). If it isn't drawed anything yet, the initial position will be (0, 0) (position zero + transform.position.x). Note that every FreestyleGraphicComponent with backgroundColor that begins with a StraightLine it will be end in the (0, 0) (position zero + transform.position.x). This position 'x' is always place taking account the dimensions defined in GameConfiguration, never the real canvas size.
* yToDraw. Final position y of the line. The initial position y is the final position y of the last line or arc drawed (imagine that you are drawing lines without quit the pencil of the paper). If it isn't drawed anything yet, the initial position will be (0, 0) (position zero + transform.position.x). Note that every FreestyleGraphicComponent with backgroundColor that begins with a StraightLine it will be end in the (0, 0) (position zero + transform.position.x). This position 'y' is always place taking account the dimensions defined in GameConfiguration, never the real canvas size.

Type Arc:
* xToDraw. Position x of the center of the imaginary circle where the arc would be placed. This position 'x' is always place taking account the dimensions defined in GameConfiguration, never the real canvas size.
* yToDraw. Position y of the center of the imaginary circle where the arc would be placed. This position 'y' is always place taking account the dimensions defined in GameConfiguration, never the real canvas size.
* radius. Radius of the arc (you can imagine a circle where the arc is drawed). This radius is always used taking account the dimensions defined in GameConfiguration, never the real canvas size.
* startAngle. Angle where we start to draw the arc.
* endAngle. Angle where we end to draw the arc.
* anticlockwise. Optional parameter (undefined - used like a falsy value - by default). It's very useful, it's true, draw the arc starting by the endAngle and finished by the startAngle (note: NOT is the same that put the startAngle the endAngle and vice versa).
```json
"FreestyleGraphicComponent": {
    "borderWidth": 7,
    "borderColor": "#ff0000",
    "backgroundColor": "#33aa1c",
    "allLines": [
        {
            "xToDraw": 200,
            "yToDraw": 15
        },
        {
            "xToDraw": 100,
            "yToDraw": 500,
            "radius": 200,
            "startAngle": 20,
            "endAngle": 75,
            "anticlockwise": true
        },
        {
            "xToDraw": 10,
            "yToDraw": 300
        }
    ]
},
```

#### 3.1.1.2.6 RigidBody
A RigidBody component defines physics propierties of a physics object (like mass, density or friction), common used by dynamics or kinematic GameObjects. If the object is static we don't need to add a RigidBody component to the GameObject. Always that a GameObject has a RigidBody component, that GameObject will need Collider component with one or more collider to show the physic behaviour of the RigidBody. It would be have a huge of properties but, for now, we only use two:
* type. The type of the Body, it can be "Dynamic" (always in movement, affected by gravity and other forces), "Static" (never in movement, not affected by gravity and any force) or "Kinematic" (mixed between dynamic or static, affected for some movements forces by code, commonly used by plataforms with movement in plataforms games, so we don't need it). Using the collider you can change the type of the RigidBody when the game is updating (ingame).
* mass. Mass of the object. If has a huge mass, its collisions caused more effect to other dynamics GameObject.

```json
"rigidbody": {
    "type": "Dynamic",
    "mass": 3
},
```

#### 3.1.1.2.7 Colliders
(Note: the 3 following sections has concepts are very hard to understand - and the more you follow, the more harder to understand - but they are very important to use, cause consists in components that give live to ours GameObject, doing that the game works. This engine simplify __a lot__ how to do this things that are more harder to use without engine, in fact in all current comercial engines is using Collider and Behaviours, and in all of them you have to create you own Tween/Easing engine - because it's essential for more efficient visual effects)

A collider component defines a global physical body of a GameObject. The GameObject can be has an sprite, a text, a graphics, a particle, nothing (for instance, a object only with transform and colliders, an invisible object), or whatever, the physical body defined always be present. The collider component consist of a body formed by a list of rectangle bodies and/or circle bodies (if you can remember the section about graphics component this is similar to RectangleComponent and CircleComponent, but composed of them, you can think that you are using like Lego pieces to create the physical object). So, all ours physics in game is managed by the colliders and the events of its collisions are managed by the behaviour components (we will see the behaviours component in the section __3.1.1.2.9 Behaviours and references__). So there two types of collider components rectangleCollider and circleCollider.

For manage colliders we used MatterJS, that allow to use position in pixels and not in metters (although all the other physic engines based in Box2D). This simplify a lot the scene creation, because we don't have to reimagine the scene in pixels and its translating in metters every time. Moreover, MatterJS fixed a lot of bugs of Box2D for Javascript and it's thoroughly used by developers.

Before explain the propierties, I alert you that you __must have a solid reason__ to use colliders (physics) in a game. Physics always takes a lot of resources and should be used in the best efficient way. Always you have to minimized the number of colliders enabled in the scene (specially minimize the number of dynamics and kinematic colliders in screen - dynamic or kinematic RigidBody type value -, when you don't use a dynamic or kinematic collider like dynamic, put it in static). So, take account that physics must be used as the ultimate final solution in a game. Only in case you haven't have a good solution and performance using some particles or some tween components or some behaviour components, you have to use colliders. For instance, due to its complex movement, the balls in Keno using tween or behaviour components requiers more performance than use physics, so for the keno balls and walls we use colliders (physic).

The commons propierties for collider components are:
* labelCollider. Name of the collider, it's an optional field but very useful for manage collision with behaviours.
* offset. Vector 2D {x, y} with the quantity to add to the transform for place collider (always pixels related to the width and the height defined in GameConfiguration, never real pixels). You have to take account that if the vector is equals to {x: 0, y: 0} the collider it will be placed at the center of the GameObject.
* layerMask. Take account to this (a lot of beginners using game engines fails for not use this detail). You don't have to think in physics like real physics in which every object can collide with each object in a space. You have to think in physics like real physics but in diferents alternative dimensions (a layer or LayerMask) that can be interact each others or not. This concept is basic and is used in games to reduce the cost, in fact in Keno game use one layer for the balls that collider with a blocker horizontal and other layer for the balls that going above the blocker and collide with the wall (so we don't use a kinematic or static collider for the Keno blocker that would be consuming a lot because it would need a fixed joint, and a lot of details in strength and things like that to works - note in this that always we have to use physics minimizing all the physic cost, and LayerMask is very usefull for this). In code we always can change the mask of a collider using the method setColliderCategories(colliderCategory: string | undefined). We have 12 LayerMasks ("layer01", "layer02",... "layer12") that only collide with object in the same LayerMask, and one LayerMask that interact with all the layers ("default"). It's an optional parameter and its vaule by default is "default".

__rectangleCollider__. Defined a collider component with the body of a rectangle.
* size. Vector {width, height} with the width and height of the body.
```json
"colliders": [
    {
        "rectangleCollider": {
            "offset": {
                "x": -40,
                "y": -104
            },
            "size": {
                "width": 1670,
                "height": 10
            }
        }
    },
    {
        "rectangleCollider": {
            "labelCollider": "further_wall",
            "offset": {
                "x": 330,
                "y": -10
            },
            "size": {
                "width": 10,
                "height": 775
            }
        }
    },
    {
        "rectangleCollider": {
            "labelCollider": "near_wall",
            "offset": {
                "x": 294,
                "y": 20
            },
            "size": {
                "width": 10,
                "height": 660
            }
        }
    },
    {
        "rectangleCollider": {
            "offset": {
                "x": 257,
                "y": 18
            },
            "size": {
                "width": 10,
                "height": 615
            }
        }
    },
    {
        "rectangleCollider": {
            "offset": {
                "x": 290,
                "y": 135
            },
            "size": {
                "width": 200,
                "height": 10
            }
        }
    }
],
```

__circleCollider__. Defined a collider component with the body of a circle.
* radius. Radius for the body.

```json
"colliders": [
    {
        "circleCollider": {
            "labelCollider": "ball",
            "offset": {
                "x": 0,
                "y": 0
            },
            "radius": 75,
            "layerMask": "layer01"
        }
    }
],
```

#### 3.1.1.2.8 Tween/Easing
Tween component emulate movements, rotations, changes in scale or opacity, using interpolate function or bezier. Tween and easing are synonyms and you will see both terms in diferents sites, but they mean the same (and sometimes I use one term or the other one). Understand what is a tween without see graphics or examples is very hard, so I recomend you see some videos on youtube and take a look to the website [easing.net](https://easings.net/). All the easing is based using beziers functions or interpolation function (the numerics methods of  Newton, Lagrange, Spline,...). When we use bezier function, you have to bear in mind that using more than one bezier function in secuence can creates very unwanted effects. So, the best option is use only one bezier tween for one function (only one tween for movement, only one tween for rotations,...) or use an interpolation function (we use Lagrange method when we only have 3 points of information, and Akima Cubic Spline when we have, at least, 5 points of information). So, the interpolation functions help us to create complex effects.

For adjust a great bezier curve, I recomend you to use [cubic-bezier.com](https://cubic-bezier.com/), for create a tween with a bezier you will need the two points position that you'll get with this editor. You can use that result with BezierTweenComponent and BezierCubicTweenComponent (both are Cubic Bezier, but BezierTweenComponent is using an iterative aproximation method - very quick and with low error margin - , and BezierCubicTweenComponent is the real Cubic Bezier formula).

An interpolation function is an iterative method that has an aproximate behavior to a polynomial function. We only need to know some points of the curve to calculate a complete curve. The best accurate interpolation function is the Akima Cubic Spline. For more information you take a look to _"interpolation function"_ article on Wikipedia. There a lot of interpolation methods but the choosen one for this engine are: Lagrange and Akima Cubic Spline.

If you think to use a tween that emulate like a parabol curve, I recomend you to use Lagrange, you only need 3 points as minimum to create the parabol. If you think to use something more complex and with a lot of curves, use Akima Cubic Spline, you'll need 5 points as minimum to emulate a polynomial function.

All tweens are defined in a `"tweenList"` array inside a GameObject. Each element in the list is an object with a single key that indicates the tween type: `"bezier"`, `"bezier-cubic"`, `"lagrange"`, or `"akima-cubic-spline"`. The common properties for all tween types are:
* totalTime. Duration of the tween animation in seconds.
* pointInitialState. Initial value `{x, y}` of the property being animated. For `"move"` and `"scale"` options the x and y are independent axes; for `"rotate"` and `"opacity"` only x is used.
* pointEndingState. Final value `{x, y}` of the property being animated.
* option. What property is being animated. Possible values: `"move"`, `"scale"`, `"rotate"`, `"opacity"`, `"callback"`. With `"callback"` the tween doesn't apply any transform — it just calls the `onTweenUpdate` callback with the interpolated value, so you can drive any custom effect from Behaviour code.
* gameObjectNameToAct. Name of the GameObject whose property will be animated (it can be the same GameObject that contains the tween, or a different one).

By default all tweens in the list execute in parallel. You can change this by adding a `"tween-configuration"` element to the list:
```json
{ "tween-configuration": { "execution-tween-mode": "sequence" } }
```

__bezier__ and __bezier-cubic__. Bezier tweens also require two control points `p1` and `p2` (the middle handles of the cubic bezier curve, as provided by [cubic-bezier.com](https://cubic-bezier.com/)):
* p1. First bezier control point `{x, y}`.
* p2. Second bezier control point `{x, y}`.
```json
"tweenList": [
    {
        "bezier": {
            "totalTime": 0.3,
            "pointInitialState": {
                "x": 0.1,
                "y": 0.1
            },
            "pointEndingState": {
                "x": 1,
                "y": 1
            },
            "option": "scale",
            "gameObjectNameToAct": "Big-Show-Ball",
            "p1": {
                "x": 0.62,
                "y": 1
            },
            "p2": {
                "x": 1,
                "y": 1.35
            }
        }
    }
],
```

__lagrange__. Requires at minimum 3 control points in a `"point-list"` array. Each point `{x, y}` represents a (time-percentage, value) pair that the interpolation curve passes through exactly.
```json
"tweenList": [
    {
        "lagrange": {
            "totalTime": 0.5,
            "pointInitialState": { "x": 0, "y": 0 },
            "pointEndingState": { "x": 1, "y": 1 },
            "option": "move",
            "gameObjectNameToAct": "My-Object",
            "point-list": [
                { "x": 0,   "y": 0   },
                { "x": 0.5, "y": 1.5 },
                { "x": 1,   "y": 1   }
            ]
        }
    }
],
```

__akima-cubic-spline__. Same structure as `lagrange` but requires at minimum 5 control points. It produces smoother curves and is more accurate for complex animations:
```json
"tweenList": [
    {
        "akima-cubic-spline": {
            "totalTime": 0.4,
            "pointInitialState": { "x": 0.1, "y": 0.1 },
            "pointEndingState": { "x": 1, "y": 1 },
            "option": "opacity",
            "gameObjectNameToAct": "Result-Box",
            "point-list": [
                { "x": 0,    "y": 0 },
                { "x": 0.25, "y": 1 },
                { "x": 0.375,"y": 0 },
                { "x": 0.5,  "y": 1 },
                { "x": 0.75, "y": 0 },
                { "x": 1,    "y": 1 }
            ]
        }
    }
],
```

#### 3.1.1.2.9 Behaviours and references
(Take account that this component is the most hard to understand, but if you understand it, you'll know the basic of how to do games with any game engine.)

A Behaviour is a TypeScript class that you write. It's the equivalent of a Unity MonoBehaviour: a piece of logic that is attached to a specific GameObject, has access to that GameObject and its components, and participates in the game loop. Behaviours are the place where all the game logic lives.

A GameObject can have one or more Behaviours, all declared in the `"behaviourComponentList"` array. Each element in the array is an object whose key is the __exact class name__ of the Behaviour (this name is used by the engine to instantiate the right class via reflection, so it must match exactly).

Inside the Behaviour entry you can put two things:
1. A `"references"` object that wires components or other GameObjects into properties of the Behaviour class (dependency injection).
2. Any number of extra properties that will be injected as plain values into the Behaviour instance (like configuration constants).

The syntax of a reference value is `"NameOfGameObject:TypeOfComponent"`. The engine will look up the named GameObject and then find the component of the indicated type on it. Special types are:
* `"GameObject"` — injects the whole GameObject instead of a component.
* `"[PoolItem]"` — injects the `PoolGameObject` pool (the name is the pool name defined in `gameConfiguration.pools`, without the word "Pool").

```json
"behaviourComponentList": [
    {
        "BallGeneratorBehaviour": {
            "references": {
                "poolBall":         "BallPool:[PoolItem]",
                "textBallPool":     "TextBallPool:[PoolItem]",
                "textBallCounter":  "Counter-Ball-Indicator-Text:TextComponent",
                "tableResult":      "Keno-TV-Frame-Background-Results:ShowResultTableBehaviour"
            }
        }
    }
],
```

Another example that mixes references with a plain configuration value:
```json
"behaviourComponentList": [
    {
        "MoveBallHorizontal": {
            "references": {
                "collider":              "Ingame-Ball:CircleColliderComponent",
                "textBall":              "TextBall:TextComponent",
                "physicsBlocker":        "blocker-physics:PhysicsBlockerBehaviour",
                "currentBallIndicator":  "Big-Show-Ball:ChangeBallScaleBehaviour",
                "floorCollider":         "Keno-TV-Frame-Content-Holes-Art-Deco:RectangleColliderComponent"
            },
            "velocityX": 12
        }
    }
],
```

The following component type names can be used in reference strings:
* `TransformComponent`
* `SpriteComponent`
* `TextComponent`
* `RectangleColliderComponent`, `CircleColliderComponent`
* `BezierTweenComponent`, `BezierCubicTweenComponent`, `LagrangeTweenComponent`, `AkimaCubicSplineTweenComponent`
* `ParticleComponentManager`
* `SoundComponent`
* `AnimationSpriteComponent`, `AnimationSpriteManagerComponent`
* Any Behaviour class name (you can inject one Behaviour into another).

#### 3.1.1.2.10 Sound
The sound component ("soundComponent") attaches audio to a GameObject using the Howler library. The asset paths must be included in `imageAsssetPaths` (the engine searches by filename). There are two modes: individual sounds and a sprite sheet (multiple sounds packed in a single file).

Common properties:
* soundNames. List of audio file names to load.

For sprite-sheet mode (multiple sounds in a single file), add:
* sprite. Object mapping each sound name to a `[startMs, durationMs]` or `[startMs, durationMs, loop]` tuple, following the Howler sprite format.

From code (inside a Behaviour) you can call:
* `soundComponent.playSound(soundName, onSoundPlayed?)` — plays the named sound.
* `soundComponent.stopSound(soundName)` — stops the named sound.

```json
"soundComponent": {
    "soundNames": ["background-music.mp3", "ball-drop.mp3"]
},
```

Sprite-sheet example:
```json
"soundComponent": {
    "soundNames": ["sounds-sprite.mp3"],
    "sprite": {
        "win":  [0,    2000],
        "lose": [2000, 1500],
        "tick": [3500, 300, true]
    }
},
```

#### 3.1.1.2.11 Animation Sprites
The animation sprites component ("spriteAnimation") plays a frame-by-frame sprite-sheet animation. Each element of the array is an independent animation clip. Assets are resolved from `imageAsssetPaths` by filename.

Properties of each animation clip:
* nameAnimation. Prefix used to locate the animation frames in the loaded sprite-sheet data.
* nameImageFileList. Array of sprite-sheet JSON file names (the atlases exported by a tool like Spine or DragonBones). Each file bundles a set of frames.
* animationSpeed. Playback speed multiplier (1 = normal speed, 0.5 = half speed, etc.).
* color. Color matrix shader applied to the animation (same format as the Sprite component).

```json
"spriteAnimation": [
    {
        "nameAnimation": "Ring_000",
        "nameImageFileList": ["Ring.json"],
        "animationSpeed": 0.11,
        "color": "(255,255,255,1)"
    }
],
```

#### 3.1.1.3 Pools
Pools allow you to reuse a fixed number of pre-created GameObjects without creating or destroying them during the game loop, avoiding garbage-collector pressure and keeping the frame rate stable.

A pool is declared in `gameConfiguration.pools` using the pattern `"PoolName": "numberOfElements:GameObjectName"`. The engine will create `numberOfElements` copies of the named GameObject (each named `GameObjectName-0`, `GameObjectName-1`, ...) and will disable them all at startup, moving them off-screen. Children GameObjects and intra-pool references in behaviours are handled automatically by the engine.

Inside a Behaviour you interact with a pool through a `PoolGameObject` reference (injected via the `[PoolItem]` reference type):
* `pool.getObject(x?, y?)` — takes an object from the pool, enables it, and optionally places it at the given position. Returns the `GameObject`.
* `pool.putObject(gameObject)` — returns an object to the pool and disables it.
* `pool.isPoolEmpty` — `true` when all objects are currently active.

A typical use-case is calling `pool.getObject()` when an event fires (new ball, new result...) and `gameObject.forceToEndCircleOfLife()` or `pool.putObject()` when the object is no longer needed.

```json
"gameConfiguration": {
    "width": 690,
    "height": 388,
    "gravity": -9.81,
    "pools": {
        "BallPool":      "20:Ingame-Ball",
        "ResultBoxPool": "20:Result-Box"
    }
},
```

The pool item GameObject (e.g. `"Ingame-Ball"`) is defined in the scene file exactly like any other GameObject, but because it is listed in `pools` the engine treats it as a template and instantiates it the given number of times. You should never manually list all the cloned objects (like `"Ingame-Ball-0"`, `"Ingame-Ball-1"`, ...) inside `childrenObjects` of another object — the engine handles the mapping automatically.

### 3.1.2 Particle files
Particle files contain the emitter configuration consumed by Pixi Particles. Each file corresponds to one entry in a `particleList` (the `"config"` field). The format is the standard Pixi Particles JSON format; the best way to create and tweak these files is using the [online Pixi Particles editor](https://pixijs.io/pixi-particles-editor/#pixieDust).

The key fields you will typically adjust are:

| Field | Description |
|---|---|
| `alpha.start` / `alpha.end` | Opacity at the start and end of a particle's life |
| `scale.start` / `scale.end` | Size multiplier at start and end |
| `color.start` / `color.end` | Tint color (hex) at start and end |
| `speed.start` / `speed.end` | Emission speed range |
| `lifetime.min` / `lifetime.max` | Minimum and maximum particle lifetime in seconds |
| `frequency` | Time between emissions (lower = more particles) |
| `maxParticles` | Hard cap on the number of simultaneous particles |
| `spawnType` | Shape of the emission zone: `"point"`, `"rect"`, `"circle"`, etc. |
| `emitterLifetime` | Total duration of the emitter (`-1` means infinite) |

A minimal example:
```json
{
    "alpha":    { "start": 1, "end": 0.25 },
    "scale":    { "start": 0.1, "end": 0.1, "minimumScaleMultiplier": 1 },
    "color":    { "start": "#ffffff", "end": "#ffffff" },
    "speed":    { "start": 500, "end": 700, "minimumSpeedMultiplier": 1 },
    "acceleration": { "x": 0, "y": 0 },
    "startRotation": { "min": 90, "max": 90 },
    "rotationSpeed": { "min": 0, "max": 120 },
    "lifetime": { "min": 0.5, "max": 4 },
    "blendMode": "normal",
    "frequency": 0.001,
    "emitterLifetime": -1,
    "maxParticles": 30,
    "pos": { "x": 0, "y": 0 },
    "addAtBack": false,
    "spawnType": "rect",
    "spawnRect": { "x": -175, "y": -370, "w": 600, "h": 20 }
}
```

Particle config files are registered at game construction time via the `particlesConfigJson` property of `GameProperties`, mapping each file name to its imported JSON data.

### 3.1.3 Template files
Templates let you generate a repeated set of GameObjects from a single JSON definition, avoiding having to write dozens of nearly identical entries in the scene file. A typical use case is a grid of result boxes, a ring of ball holes, or any repeated layout element.

A template file has three top-level keys:

* `"vars"`. Configuration for the template engine itself plus any custom variables your `GameObjectTemplate` subclass needs. The mandatory engine keys are:
  * `numberElements`. How many times the template will be instantiated.
  * `isUseIndexWithoutZeroForTemplate`. If `true`, the `[index]` placeholder starts at 1 instead of 0.
* `"template-vars"`. Initial default values for any placeholder variables used inside `"template"`. These values can be updated per-iteration by your `GameObjectTemplate` subclass inside `doBeforeBuildIndexTemplate`.
* `"template"`. The JSON object that will be repeated. Inside it you can use the following placeholders:
  * `[index:number]` / `[index:string]` — replaced with the iteration index.
  * `[varName:number]` / `[varName:string]` — replaced with the current value of `templateVars["varName"]`.

```json
{
    "vars": {
        "numberElements": 80,
        "isUseIndexWithoutZeroForTemplate": true,
        "posXFirstElement": -143,
        "posYFirstElement": -87.5,
        "marginX": 31.5,
        "marginY": 25,
        "numberColumns": 10
    },
    "template-vars": {
        "positionX": 0,
        "positionY": 0
    },
    "template": {
        "Text-Result-Table-[index:number]": {
            "transform": {
                "position": {
                    "x": "[positionX:number]",
                    "y": "[positionY:number]",
                    "z": -0.3
                },
                "scale": { "x": 1, "y": 1 },
                "childrenObjects": []
            },
            "textComponent": {
                "textValue": "[index:string]",
                "fontSize": 14,
                "fontFamily": "Josefin-Sans-Light",
                "align": "center",
                "textBaseline": "center",
                "opacity": 0.12,
                "fill": "#ffffff"
            },
            "isEnabled": true
        }
    }
}
```

Note that the extra keys in `"vars"` (`posXFirstElement`, `marginX`, etc.) are injected into the `GameObjectTemplate` subclass by the engine, so you can read them as instance properties inside `doBeforeBuildIndexTemplate`. The `"template-vars"` section provides the initial values of `this.templateVars`, which your code updates before each iteration.

### 3.2 Typescript code

#### 3.2.1 GameObjectTemplate
`GameObjectTemplate` is an abstract class that you extend to define the per-iteration logic for a template. The engine injects all fields from the `"vars"` section of the template JSON as instance properties on your subclass, so you can declare them as class members and read them directly.

The only method you must implement is:

```ts
doBeforeBuildIndexTemplate(index: number, templateVars: TemplateVars): void
```

This method is called once before each iteration. It receives the current `index` and the `templateVars` dictionary (which maps placeholder names to their current values). You update `templateVars` here to produce the right values for that iteration.

A complete example that computes grid positions:
```ts
import { GameObjectTemplate, TemplateVars } from "graphics-engine";

export class TextResultTableTemplate extends GameObjectTemplate {
    // Injected from "vars" in the template JSON:
    private posXFirstElement: number;
    private posYFirstElement: number;
    private marginX: number;
    private marginY: number;
    private numberColumns: number;

    doBeforeBuildIndexTemplate(index: number, templateVars: TemplateVars): void {
        const row = Math.floor(index / this.numberColumns);
        const col = Math.floor(index % this.numberColumns);
        templateVars["positionX"] = this.posXFirstElement + (this.marginX * col);
        templateVars["positionY"] = this.posYFirstElement + (this.marginY * row);
    }
}
```

#### 3.2.2 Behaviours
A Behaviour is a TypeScript class that implements the `BehaviourComponent` interface (or extends the `BehaviourComponent` base class). It is the primary place for writing game logic.

The engine calls lifecycle methods on each Behaviour in a defined order:
1. `onLoad()` — called once when assets are loading. Use it to create `Timer` instances or read from `DataShared`.
2. `onAwake()` — called once just before the scene starts, with all GameObjects already instantiated. References have been injected at this point.
3. `onStart()` — called once when the scene starts running, after all `onAwake` calls have finished.
4. `onEnable()` — called every time the GameObject is enabled (including when a pool object is taken out of the pool).
5. `onDisable()` — called every time the GameObject is disabled (including when returned to the pool).
6. `update(deltaTime: number)` — called every frame. `deltaTime` is the time in seconds since the last frame, already normalized so it is machine-independent.
7. `onCollisionEnter(collidedWith: CollidedWith)` — called on the first frame two physics bodies start overlapping.
8. `onCollisionStay(collidedWith: CollidedWith)` — called every frame while two bodies remain overlapping.
9. `onCollisionExit(collidedWith: CollidedWith)` — called when two bodies stop overlapping.
10. `onEndingCircleOfLife()` — called when `gameObject.forceToEndCircleOfLife()` is invoked. Useful for triggering pool recycling from a behaviour.
11. `onDestroy()` — called when the scene is destroyed.

All lifecycle methods are optional. Implement only the ones you need.

To access the owning `GameObject` from inside the Behaviour, cast `this` to `BehaviourComponentInterface`:
```ts
get _gameObject(): GameObject {
    return (<BehaviourComponentInterface> this).gameObject!;
}
```

A minimal Behaviour example:
```ts
import {
    BehaviourComponent, BehaviourComponentInterface,
    GameObject, Game, TextComponent
} from "graphics-engine";
import { MyDataShared } from "../my-data-shared";

export class ScoreBehaviour implements BehaviourComponent {
    // Injected via "references" in the scene JSON:
    scoreText: TextComponent;

    private dataShared: MyDataShared;

    get _gameObject(): GameObject {
        return (<BehaviourComponentInterface> this).gameObject!;
    }

    onAwake = () => {
        this.dataShared = <MyDataShared> Game.instance.dataShared;
    }

    onStart = () => {
        this.scoreText.setTextValue("0");
    }

    update = (deltaTime: number) => {
        // update score display every frame if needed
    }
}
```

All Behaviour classes must be registered in a `behaviourTypeList` array and passed to the `Game` constructor so the engine can instantiate them by name. The `nameClass` field must exactly match the class name:
```ts
export const behaviourTypeList = [
    { nameClass: 'ScoreBehaviour', classType: ScoreBehaviour },
    { nameClass: 'MoveBallHorizontal', classType: MoveBallHorizontal },
    // ...
];
```

#### 3.2.3 Timers
`Timer` is a utility class for triggering a callback after a fixed duration measured in game time (via `deltaTime`, so it is paused when the tab is hidden and machine-independent). Create timers in `onLoad` so they are ready when the scene starts.

```ts
import { Timer } from "graphics-engine";

// Create a 1.5-second timer:
const myTimer = new Timer(1.5);

// Start it and provide the callback:
myTimer.start(() => {
    console.log("Timer finished!");
});

// You can pause and resume:
myTimer.putInPause();
myTimer.start(callback); // calling start on a paused timer resumes it

// Or stop it immediately (fires the callback right away):
myTimer.stopNow();

// Check its state:
myTimer.isStop();   // true when time has elapsed
myTimer.isPause();  // true when paused
```

Typical use inside a Behaviour:
```ts
private timerToEnd: Timer;

onLoad = () => {
    this.timerToEnd = new Timer(2.5);
}

onEnable = () => {
    this.timerToEnd.start(() => this._gameObject.forceToEndCircleOfLife());
}
```

#### 3.2.4 Data Shared
`DataShared` is a plain class you extend to hold any state that multiple Behaviours need to share. There is one instance per game, accessible from any Behaviour via `Game.instance.dataShared`. Cast it to your specific subclass:

```ts
import { DataShared } from "graphics-engine";

export class MyDataShared extends DataShared {
    score: number = 0;
    round: number = 1;
    onRoundEnded: () => void;
}
```

Inside a Behaviour:
```ts
onAwake = () => {
    const shared = <MyDataShared> Game.instance.dataShared;
    shared.onRoundEnded = () => this.handleRoundEnd();
}
```

The `DataShared` instance is passed to the `Game` constructor as the `dataShared` property of `GameProperties`.

#### 3.2.5 Creating the game
The entry point of any application using this engine is the `Game` class. A typical bootstrap flow has two phases: **load** (parses JSON, loads assets) and **start** (mounts the canvas in the DOM and begins rendering).

```ts
import * as SceneData        from "./scenes/my-scene.json";
import * as TemplateData     from "./scenes/templates/my-template.json";
import * as ParticleData     from "./scenes/particles/my-particles.json";
import {
    Game, Scene, MockNgZone, cloneJSONData
} from "graphics-engine";
import { behaviourTypeList } from "./behaviours/behaviour-type-list";
import { MyDataShared }      from "./my-data-shared";
import { MyTemplate }        from "./templates/my-template";

const SCENE_NAME    = "my-scene";
const TEMPLATE_NAME = "my-template";

// Phase 1 — construct and load.
// This must be called once, before any scene is started.
const game = new Game(
    // Array of scene descriptors:
    [
        { nameScene: SCENE_NAME, jsonData: SceneData },
    ],
    // Array of template descriptors:
    [
        {
            nameTemplate:      TEMPLATE_NAME,
            gameSceneToApply:  SCENE_NAME,
            type:              MyTemplate,
            jsonData:          cloneJSONData(TemplateData),
        },
    ],
    // GameProperties:
    {
        imageAsssetPaths:   assetPaths,          // string[] of resolved asset URLs / paths
        particlesConfigJson: [
            { nameParticle: "my-particles.json", data: ParticleData },
        ],
        languageCode:       "en",
        ngZone:             new MockNgZone(),    // use Angular NgZone if inside Angular
        antialiasEnabled:   false,
        pauseOnTabOrWindowChange: true,
        debugProperties: {
            isDebuggerAllowed:    false,
            isPhysicTraceEnabled: false,
        },
        behaviourTypeList,
        dataShared: new MyDataShared(),
        // Optional loading callbacks:
        utilities: {
            onPercentLoader:    () => console.log(`Loading... ${game.currentLoadingProgressPercent}%`),
            onLoadingCompleted: () => console.log("All assets loaded."),
        },
    }
);

// Load assets and resolve all scene references:
const scene: Scene = await game.load(SCENE_NAME);

// Phase 2 — start.
// Mount the canvas inside a DOM element and begin the game loop:
const divCanvas = document.getElementById("canvas-container")!;
await scene.start(divCanvas, { width: 690, height: 388 }, "#000000");
```

Key `GameProperties` fields:

| Field | Type | Description |
|---|---|---|
| `imageAsssetPaths` | `string[]` | All asset URLs resolved at build time. The engine matches image/sound file names against this list. |
| `particlesConfigJson` | `ParticleConfigJson[]` | Particle emitter config files indexed by name. |
| `languageCode` | `string` | BCP 47 language code used for font loading and localization utilities. |
| `ngZone` | `NgZone` | Pass `new MockNgZone()` outside Angular, or the real Angular `NgZone` inside. |
| `antialiasEnabled` | `boolean` | Enables WebGL anti-aliasing. Disable for pixel-art or performance-critical scenes. |
| `pauseOnTabOrWindowChange` | `boolean` | Pauses `deltaTime` accumulation when the page is hidden. |
| `debugProperties` | `DebugProperties` | `isDebuggerAllowed` draws physics collider outlines; `isPhysicTraceEnabled` adds extra physics logging. |
| `behaviourTypeList` | `BehaviourTypeList[]` | Maps class names to Behaviour constructors. Must include every Behaviour referenced in any scene JSON. |
| `dataShared` | `DataShared` | Optional shared state object, accessible from all Behaviours via `Game.instance.dataShared`. |
| `utilities` | `Utilities` | Optional loading progress callbacks (`onPercentLoader`, `onLoadingCompleted`). |

To destroy the game (e.g. when unmounting a component) call:
```ts
await Game.instance.destroy();
```

To reset the game with new data without a full page reload:
```ts
await game.reset(newSceneData, newTemplateData, newGameProperties);
```

## 4. Engine documentation
