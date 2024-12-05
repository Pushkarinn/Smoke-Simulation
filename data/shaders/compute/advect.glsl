#version 460 core

layout (local_size_x = 8, local_size_y = 8, local_size_z = 8) in;

layout (rgba32f, binding = 0) uniform image3D img_output;

uniform sampler3D u_inputImg;
uniform sampler3D u_velocity;

uniform float dt;

vec4 sampleTex(vec3 p, sampler3D tex, ivec3 dims) {
    return texture(tex, (p+vec3(0.5)) / vec3(dims));
}


void main() {
    ivec3 dims = imageSize(img_output);
    ivec3 coords = ivec3(gl_GlobalInvocationID.xyz);

    if(coords.x == 0 || coords.y == 0 || coords.z == 0 || coords.x == dims.x - 1 || coords.y == dims.y - 1 || coords.z == dims.z - 1) {
        return;
    }

    vec3 vel = 0.125 * (
        sampleTex(vec3(coords) + 0.5 * vec3( 1,  1,  1), u_velocity, dims).gba +
        sampleTex(vec3(coords) + 0.5 * vec3(-1,  1,  1), u_velocity, dims).gba +
        sampleTex(vec3(coords) + 0.5 * vec3( 1, -1,  1), u_velocity, dims).gba +
        sampleTex(vec3(coords) + 0.5 * vec3(-1, -1,  1), u_velocity, dims).gba +
        sampleTex(vec3(coords) + 0.5 * vec3( 1,  1, -1), u_velocity, dims).gba +
        sampleTex(vec3(coords) + 0.5 * vec3(-1,  1, -1), u_velocity, dims).gba +
        sampleTex(vec3(coords) + 0.5 * vec3( 1, -1, -1), u_velocity, dims).gba +
        sampleTex(vec3(coords) + 0.5 * vec3(-1, -1, -1), u_velocity, dims).gba
    );


    vec3 p_back = vec3(coords) - dt * vel;

    vec4 advected = sampleTex(p_back, u_inputImg, dims);

    imageStore(img_output, coords, advected);   
}