#version 460 core

layout (local_size_x = 8, local_size_y = 8, local_size_z = 8) in;

layout (rgba32f, binding = 0) uniform image3D img_output;

uniform sampler3D u_inputImg;

void main() {
    // Compute divergence of the velocity field (gba components)

    ivec3 dims = imageSize(img_output);
    ivec3 coords = ivec3(gl_GlobalInvocationID.xyz);

    if(coords.x == 0 || coords.y == 0 || coords.z == 0 || coords.x == dims.x - 1 || coords.y == dims.y - 1 || coords.z == dims.z - 1) {
        return;
    }

    // With texelFetch
    float dvx = (texelFetch(u_inputImg, coords + ivec3(1, 0, 0), 0).g - texelFetch(u_inputImg, coords - ivec3(1, 0, 0), 0).g) * 0.5;
    float dvy = (texelFetch(u_inputImg, coords + ivec3(0, 1, 0), 0).b - texelFetch(u_inputImg, coords - ivec3(0, 1, 0), 0).b) * 0.5;
    float dvz = (texelFetch(u_inputImg, coords + ivec3(0, 0, 1), 0).a - texelFetch(u_inputImg, coords - ivec3(0, 0, 1), 0).a) * 0.5;

    float div = dvx + dvy + dvz;

	imageStore(img_output, coords, vec4(div, 0.0, 0.0, 0.0));
}