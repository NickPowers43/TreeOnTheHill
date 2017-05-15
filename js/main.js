
var canvas = document.getElementById("mycanvas");
var gl = canvas.getContext("webgl2", {antialias: true});

var ext0 = gl.getExtension("WEBGL_color_buffer_float");

function getShader(gl, type, source)
{
	var shader = gl.createShader(gl[type]);
	gl.shaderSource(shader,source);
	gl.compileShader(shader);
	if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))
	{
		console.error(type + "\n" + gl.getShaderInfoLog(shader));
		return null;
	}
	return shader;
}

function initShaders(gl, vsSource, fsSource, tfVaryings)
{
	var fragmentShader = getShader(gl, "FRAGMENT_SHADER", fsSource);
	var vertexShader = getShader(gl, "VERTEX_SHADER", vsSource);

	var shaderProgram = gl.createProgram();
	gl.attachShader(shaderProgram,vertexShader);
	gl.attachShader(shaderProgram,fragmentShader);
	
	if(tfVaryings)
	{
		gl.transformFeedbackVaryings(shaderProgram, tfVaryings, gl.INTERLEAVED_ATTRIBS);
	}

	gl.linkProgram(shaderProgram);

	if(!gl.getProgramParameter(shaderProgram,gl.LINK_STATUS))
	{
		console.error("cloud not initialise shaders");
		return undefined;
	}
	//gl.useProgram(shaderProgram);
	
	return shaderProgram;

	//shaderProgram.vertexPositionAttribute=gl.getAttribLocation(shaderProgram,"aVertexPosition");
	//gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

	//shaderProgram.pMatrixUniform=gl.getUniformLocation(shaderProgram,"uPMatrix");
	//shaderProgram.mvMatrixUniform=gl.getUniformLocation(shaderProgram,"uMVMatrix");
}

function checkFramebuffer(gl, framebuffer){
    // assumes the framebuffer is bound
    var valid = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    switch(valid){
        case gl.FRAMEBUFFER_UNSUPPORTED:
            throw 'Framebuffer is unsupported';
        case gl.FRAMEBUFFER_INCOMPLETE_ATTACHMENT:
            throw 'Framebuffer incomplete attachment';
        case gl.FRAMEBUFFER_INCOMPLETE_DIMENSIONS:
            throw 'Framebuffer incomplete dimensions';
        case gl.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT:
            throw 'Framebuffer incomplete missing attachment';
    }
}

function createGLObjects(gl, myVBO, theirVBO, myTex, theirTex, texWidth)
{
	var fbo = gl.createFramebuffer();
	
	
    gl.bindTexture(gl.TEXTURE_2D, myTex);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, texWidth, 1, 0, gl.RGBA, gl.FLOAT, null);
	gl.bindTexture(gl.TEXTURE_2D, null);
	
	var rbo = gl.createRenderbuffer();
	
    gl.bindRenderbuffer(gl.RENDERBUFFER, rbo);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, texWidth, 1);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
	
	gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, myTex, 0);
	gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, rbo);
	checkFramebuffer(gl, fbo);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	
	
	var tfo = gl.createTransformFeedback();
	
	
	return {
		vbo: myVBO,
		tex: myTex,
		rbo: rbo,
		bind: function(program, positionTexLoc) {
			
			gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
			
			gl.bindBuffer(gl.ARRAY_BUFFER, theirVBO);
			gl.enableVertexAttribArray(0);
			gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
			
			gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, tfo);
			gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, myVBO);
			
			gl.beginTransformFeedback(gl.POINTS);
		},
		unbind: function(program, positionTexLoc) {
			
			gl.endTransformFeedback();
			
			gl.disableVertexAttribArray(0);
			gl.bindBuffer(gl.ARRAY_BUFFER, null);
			
			gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, null);
			gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);
			
			gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		}
	};
}

function createSimGLObjects(gl, texWidth)
{
	var vbo0 = gl.createBuffer();
	var vbo1 = gl.createBuffer();
	
	var tex0 = gl.createTexture();
	var tex1 = gl.createTexture();
	
	return [
		createGLObjects(gl, vbo0, vbo1, tex0, tex1, texWidth),
		createGLObjects(gl, vbo1, vbo0, tex1, tex0, texWidth)
	];
}

var run = function (gl, resources) {
	

	var shaderProgram = initShaders(
		gl, 
		resources["js/shaders/vertex.txt"], 
		resources["js/shaders/fragment.txt"]
	);
	
	var modelMatLoc = gl.getUniformLocation(shaderProgram, "modelMat");
	var viewMatLoc = gl.getUniformLocation(shaderProgram, "viewMat");
	var projMatLoc = gl.getUniformLocation(shaderProgram, "projMat");
	
	var simProgram = initShaders(
		gl, 
		resources["js/shaders/particlesim.vs"], 
		resources["js/shaders/particlesim.fs"],
		["tfVertexVelocity"]
	);
	
	var positionTexLoc = gl.getUniformLocation(simProgram, "positionTex");
	
	var renderProgram = initShaders(
		gl, 
		resources["js/shaders/particles/render/vs.txt"], 
		resources["js/shaders/particles/render/fs.txt"]
	);
	
	var positionTexLoc2 = gl.getUniformLocation(renderProgram, "positionTex");
	
	var modelMatLoc2 = gl.getUniformLocation(renderProgram, "modelMat");
	var viewMatLoc2 = gl.getUniformLocation(renderProgram, "viewMat");
	var projMatLoc2 = gl.getUniformLocation(renderProgram, "projMat");
	
	if(!shaderProgram)
		return;
	
	
	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	
	gl.depthFunc(gl.LEQUAL);
	
	gl.disable(gl.CULL_FACE);

	var vbo = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
	gl.bufferData(
		gl.ARRAY_BUFFER,
		new Float32Array(
			[
				0,0,0,1,
				1,1,0,1,
				1,0,0,1,
			]
		),
		gl.STATIC_DRAW
	);
	
	var t = 0.0;
	
	var particleCount = 1024;
	
	var positions = new Float32Array(particleCount * 4);
	
	var vboData = [];
	for(var i = 0; i < particleCount; i++)
	{
		vboData.push(Math.random(), Math.random(), Math.random());
	}
	vboData = new Float32Array(vboData);
	
	
	//var simObjects = createSimGLObjects(gl, particleCount);
	
	var tex2 = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex2);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, particleCount, 1, 0, gl.RGBA, gl.FLOAT, positions);
	gl.bindTexture(gl.TEXTURE_2D, null);
	
    /*gl.bindTexture(gl.TEXTURE_2D, simObjects[1].tex);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, particleCount, 1, 0, gl.RGBA, gl.FLOAT, positions);
	gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindTexture(gl.TEXTURE_2D, simObjects[0].tex);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, particleCount, 1, 0, gl.RGBA, gl.FLOAT, positions);
	gl.bindTexture(gl.TEXTURE_2D, null);
	
	gl.bindBuffer(gl.ARRAY_BUFFER, simObjects[1].vbo);
	gl.bufferData(gl.ARRAY_BUFFER, vboData, gl.STATIC_DRAW);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);
	gl.bindBuffer(gl.ARRAY_BUFFER, simObjects[0].vbo);
	gl.bufferData(gl.ARRAY_BUFFER, vboData, gl.STATIC_DRAW);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);)*/
	
	var vbo2 = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vbo2);
	gl.bufferData(gl.ARRAY_BUFFER, vboData, gl.STATIC_DRAW);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);
	
	var update = function() {
		
		canvas.width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
		canvas.height = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
		
		//gl.useProgram(simProgram);
		
		
		//simulate tree
		//simObjects[0].bind(simProgram, positionTexLoc);
		//gl.disable(gl.DEPTH_TEST);
		
		//gl.uniform1i(positionTexLoc, simObjects[1].tex);
		//gl.drawArrays(gl.POINTS, 0, particleCount);
		//gl.uniform1i(positionTexLoc, null);
		
		//simObjects[0].unbind(simProgram, positionTexLoc);
		
		//swap GL objects
		//simObjects.push(simObjects.shift());
		
		
		gl.enable(gl.DEPTH_TEST);
		
		//draw tree
		gl.viewport(0, 0, window.innerWidth, window.innerHeight);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
		
		gl.useProgram(shaderProgram);
		
		var projMat = mat4.create();
		mat4.perspective(projMat, Math.PI * 0.25, window.innerWidth / window.innerHeight, 0.01, 100.0);
		
		var orbitRadius = 5.0;
		var height = 2.0;
		
		var angle = t * 0.1;
		
		var camPos = vec3.fromValues(Math.sin(angle) * orbitRadius, height, Math.cos(angle) * orbitRadius);
		var camTarget = vec3.fromValues(0, 0, 0);
		var up = vec3.fromValues(0, 1, 0);
		
		var viewMat = mat4.create();
		//mat4.rotateX(viewMat, viewMat, Math.sin(t));
		//mat4.translate(viewMat, viewMat, camPos);
		mat4.lookAt(viewMat, camPos, camTarget, up);
		
		gl.uniformMatrix4fv(projMatLoc, false, projMat);
		gl.uniformMatrix4fv(viewMatLoc, false, viewMat);
		
		gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
		gl.enableVertexAttribArray(0);
		gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 0, 0);
		
		gl.drawArrays(gl.TRIANGLES, 0, 3);
		
		
		
		gl.useProgram(renderProgram);
		
		gl.uniformMatrix4fv(projMatLoc2, false, projMat);
		gl.uniformMatrix4fv(viewMatLoc2, false, viewMat);
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, tex2);
		gl.uniform1i(positionTexLoc2, 0);
		
		gl.bindBuffer(gl.ARRAY_BUFFER, vbo2);
		gl.enableVertexAttribArray(0);
		gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
		
		gl.drawArrays(gl.POINTS, 0, particleCount);
		
		/*gl.disableVertexAttribArray(0);
		gl.bindBuffer(gl.ARRAY_BUFFER, null);
		
		gl.uniform1i(positionTexLoc2, null);*/
		
		gl.useProgram(null);
		
		t += 0.0166666666;

		requestAnimationFrame(update);
	};

	requestAnimationFrame(update);
};

var resourcePaths = [
	"js/shaders/fragment.txt",
	"js/shaders/vertex.txt",
	"js/shaders/particlesim.vs",
	"js/shaders/particlesim.fs",
	"js/shaders/particles/render/vs.txt",
	"js/shaders/particles/render/fs.txt"
];

var start = function() {

	var resources = {};

	var loadedCount = 0;
	resourcePaths.forEach(function(path) {
		
		var req = new XMLHttpRequest();
		req.addEventListener("load", function() {
			
			resources[path] = req.responseText;
			
			loadedCount++;
			if(loadedCount === resourcePaths.length)
			{
				run(gl, resources);
			}
		});
		req.open("GET", path);
		req.send();
	});
};



