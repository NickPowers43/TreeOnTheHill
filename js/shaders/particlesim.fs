#version 300 es

precision highp float;

layout(location = 0) out vec4 color;

in vec4 position;

void main()
{
	color = position;
}

