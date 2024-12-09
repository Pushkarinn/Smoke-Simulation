#version 460 core

layout (local_size_x = 8, local_size_y = 8, local_size_z = 8) in;

layout (rgba32f, binding = 0) uniform image3D img_output;

uniform sampler3D u_inputImg;
uniform sampler3D u_velocity;


void main() {
    ivec3 dims = imageSize(img_output);
    ivec3 coords = ivec3(gl_GlobalInvocationID.xyz);

    if(coords.x == 0 || coords.y == 0 || coords.z == 0 || coords.x == dims.x - 1 || coords.y == dims.y - 1 || coords.z == dims.z - 1) {
        return;
    }

    vec4 velocity = texelFetch(u_velocity, coords, 0);

    float g_L = texelFetch(u_inputImg, coords + ivec3(-1, 0, 0), 0).r;
    float g_R = texelFetch(u_inputImg, coords + ivec3(+1, 0, 0), 0).r;
    float g_B = texelFetch(u_inputImg, coords + ivec3(0, -1, 0), 0).r;
    float g_T = texelFetch(u_inputImg, coords + ivec3(0, +1, 0), 0).r;
    float g_D = texelFetch(u_inputImg, coords + ivec3(0, 0, -1), 0).r;
    float g_U = texelFetch(u_inputImg, coords + ivec3(0, 0, +1), 0).r;
    
    float dgx = (g_R - g_L) / 2.0;
    float dgy = (g_T - g_B) / 2.0;
    float dgz = (g_U - g_D) / 2.0;

    vec3 nabla_g = vec3(dgx, dgy, dgz);

    velocity.gba -= nabla_g;

	imageStore(img_output, coords, velocity);
}