#version 300 es

precision highp float;

uniform sampler2D positionTex;

layout (location = 0) in vec3 aVertexVelocity;

out vec4 position;

out vec3 tfVertexVelocity;

void main()
{
	vec3 positionTexCoord = vec3(float(gl_VertexID) * (1.0 / 1024.0), 0.5, 0.0);
	
	position = texture(positionTex, positionTexCoord.xy);
	
	tfVertexVelocity = aVertexVelocity;

	gl_Position = vec4(positionTexCoord,1);
}
