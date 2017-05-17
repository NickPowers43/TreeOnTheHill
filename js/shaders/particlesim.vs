#version 300 es

precision highp float;

uniform sampler2D positionTex;

layout (location = 0) in vec3 aVertexVelocity;

out vec4 position;

out vec3 tfVertexVelocity;

void main()
{
	position = texelFetch(positionTex, ivec2(gl_VertexID, 0), 0);// + vec4(0.001, 0.0, 0.0, 0.0);
	
	tfVertexVelocity = aVertexVelocity;

	gl_Position = vec4(float(gl_VertexID) * (1.0 / 1024.0), 0.0, 0.0, 1);
}
