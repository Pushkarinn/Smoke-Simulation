#version 460 core

layout (local_size_x = 8, local_size_y = 8, local_size_z = 8) in;

layout (rgba32f, binding = 0) uniform image3D img_output;

void main() {
	ivec3 coords = ivec3(gl_GlobalInvocationID);
    ivec3 dims = imageSize(img_output);
    
    float dist = length(coords - ivec3(128, 16, 128));
    float val = dist < 16 ? 1.0f : 0.0f;

	
	imageStore(img_output, coords, vec4(val, 0.0, val * 45., 0.0));
}