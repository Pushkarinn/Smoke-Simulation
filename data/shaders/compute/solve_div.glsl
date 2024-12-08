#version 460 core

layout (local_size_x = 8, local_size_y = 8, local_size_z = 8) in;

layout (rgba32f, binding = 0) uniform image3D img_output;

uniform sampler3D u_inputImg;
uniform sampler3D u_divergence;

void set_boundary(ivec3 coords, ivec3 dims) {
    if(coords.x == 0) {
        imageStore(img_output, coords, texelFetch(u_inputImg, coords + ivec3(1, 0, 0), 0));
    }
    if(coords.x == dims.x - 1) {
        imageStore(img_output, coords, texelFetch(u_inputImg, coords + ivec3(-1, 0, 0), 0));
    }
    if(coords.y == 0) {
        imageStore(img_output, coords, texelFetch(u_inputImg, coords + ivec3(0, 1, 0), 0));
    }
    if(coords.y == dims.y - 1) {
        imageStore(img_output, coords, texelFetch(u_inputImg, coords + ivec3(0, -1, 0), 0));
    }
    if(coords.z == 0) {
        imageStore(img_output, coords, texelFetch(u_inputImg, coords + ivec3(0, 0, 1), 0));
    }
    if(coords.z == dims.z - 1) {
        imageStore(img_output, coords, texelFetch(u_inputImg, coords + ivec3(0, 0, -1), 0));
    }
}


void main() {
    ivec3 dims = imageSize(img_output);
    ivec3 coords = ivec3(gl_GlobalInvocationID.xyz);

    if(coords.x == 0 || coords.y == 0 || coords.z == 0 || coords.x == dims.x - 1 || coords.y == dims.y - 1 || coords.z == dims.z - 1) {
        set_boundary(coords, dims);
        return;
    }

    vec4 divergence = texelFetch(u_divergence, coords, 0);
    vec4 g_L = texelFetch(u_inputImg, coords + ivec3(-1, 0, 0), 0);
    vec4 g_R = texelFetch(u_inputImg, coords + ivec3(+1, 0, 0), 0);
    vec4 g_B = texelFetch(u_inputImg, coords + ivec3(0, -1, 0), 0);
    vec4 g_T = texelFetch(u_inputImg, coords + ivec3(0, +1, 0), 0);
    vec4 g_D = texelFetch(u_inputImg, coords + ivec3(0, 0, -1), 0);
    vec4 g_U = texelFetch(u_inputImg, coords + ivec3(0, 0, +1), 0);

    vec4 sum = g_L + g_R + g_B + g_T + g_D + g_U;

    float res = (sum.r - divergence.r) / 6.0;

	imageStore(img_output, coords, vec4(res, 0.0, 0.0, 0.0));
}