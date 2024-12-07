#ifndef VOXEL_TEXTURE_HPP
#define VOXEL_TEXTURE_HPP

#include "gl_includes.hpp"
#include "shader.hpp"

class VoxelTexture {
public:
    GLuint densVelTextureID{};
    GLuint divergenceTextureID{};
    GLuint shaderID{};
    GLuint diffuseShaderID{};
    GLuint advectShaderID{};
    GLuint divShaderID{};

    GLuint dimXZ{};
    GLuint dimY{};

    std::vector<float> data{};

public:
    VoxelTexture() {
        dimXZ = 128;
        dimY = 128;
    }
    ~VoxelTexture() {
        if (densVelTextureID) glDeleteTextures(1, &densVelTextureID);
        if (divergenceTextureID) glDeleteTextures(1, &divergenceTextureID);
        if (shaderID) glDeleteProgram(shaderID);
        if (diffuseShaderID) glDeleteProgram(diffuseShaderID);
        if (advectShaderID) glDeleteProgram(advectShaderID);
        if (divShaderID) glDeleteProgram(divShaderID);
    }

    int index(int x, int y, int z, int channel) {
        return 4 * (x + y * dimXZ + z * dimXZ * dimY) + channel;
    }

    void generate_data() {

        data.resize(dimXZ * dimY * dimXZ * 4);
        data.assign(dimXZ * dimY * dimXZ * 4, 0.0f);

        for (int i = 0; i < dimXZ; i++) {
            for (int j = 0; j < dimY; j++) {
                for (int k = 0; k < dimXZ; k++) {
                    float val = (i >= 32 && i < 96 && j >= 32 && j < 96 && k >= 32 && k < 96) ? 1.0f : 0.0f;
                    data[index(i, j, k, 0)] = val;

                    float vel_val = (i >= 16 && i < 80 && j >= 32 && j < 96 && k >= 32 && k < 96) ? 5.0f : 0.0f;
                    data[index(i, j, k, 1)] = vel_val;
                }
            }
        }

    }

    void init_textures() {
        generate_data();

        if (shaderID) glDeleteProgram(shaderID);
        if (diffuseShaderID) glDeleteProgram(diffuseShaderID);
        if (advectShaderID) glDeleteProgram(advectShaderID);

        shaderID = glCreateProgram();
        diffuseShaderID = glCreateProgram();
        advectShaderID = glCreateProgram();
        divShaderID = glCreateProgram();

        loadShader(shaderID, GL_COMPUTE_SHADER, "../data/shaders/compute.glsl");
        loadShader(diffuseShaderID, GL_COMPUTE_SHADER, "../data/shaders/compute/diffuse.glsl");
        loadShader(advectShaderID, GL_COMPUTE_SHADER, "../data/shaders/compute/advect.glsl");
        loadShader(divShaderID, GL_COMPUTE_SHADER, "../data/shaders/compute/div.glsl");

        glLinkProgram(shaderID);
        glLinkProgram(diffuseShaderID);
        glLinkProgram(advectShaderID);
        glLinkProgram(divShaderID);

        if (!densVelTextureID) {
            glGenTextures(1, &densVelTextureID);
        }

        glBindTexture(GL_TEXTURE_3D, densVelTextureID);

        float borderColor[] = { 0.0f, 0.0f, 0.0f, 0.0f };
        glTexParameterfv(GL_TEXTURE_3D, GL_TEXTURE_BORDER_COLOR, borderColor);

        glTexParameteri(GL_TEXTURE_3D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
        glTexParameteri(GL_TEXTURE_3D, GL_TEXTURE_MIN_FILTER, GL_LINEAR);
        glTexParameteri(GL_TEXTURE_3D, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_BORDER);
        glTexParameteri(GL_TEXTURE_3D, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_BORDER);

        glTexImage3D(GL_TEXTURE_3D, 0, GL_RGBA32F, dimXZ, dimY, dimXZ, 0, GL_RGBA, GL_FLOAT, data.data());

        if (!divergenceTextureID) {
            glGenTextures(1, &divergenceTextureID);
        }

        glBindTexture(GL_TEXTURE_3D, divergenceTextureID);

        glTexParameterfv(GL_TEXTURE_3D, GL_TEXTURE_BORDER_COLOR, borderColor);

        glTexParameteri(GL_TEXTURE_3D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
        glTexParameteri(GL_TEXTURE_3D, GL_TEXTURE_MIN_FILTER, GL_LINEAR);
        glTexParameteri(GL_TEXTURE_3D, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_BORDER);
        glTexParameteri(GL_TEXTURE_3D, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_BORDER);

        glTexImage3D(GL_TEXTURE_3D, 0, GL_RGBA32F, dimXZ, dimY, dimXZ, 0, GL_RGBA, GL_FLOAT, nullptr);
    }

    void simulationStep(glm::vec3 targetSize, glm::vec3 targetOffest, float dt) {
        //std::cout << "Generating voxel texture..." << std::endl;

        glUseProgram(diffuseShaderID);

        setUniform(diffuseShaderID, "dt", dt);
        setUniform(diffuseShaderID, "mu_density", 0.0001f);
        setUniform(diffuseShaderID, "mu_velocity", 0.0001f);
        setUniform(diffuseShaderID, "u_inputImg", 0);

        glActiveTexture(GL_TEXTURE0);
        glBindTexture(GL_TEXTURE_3D, densVelTextureID);

        glBindImageTexture(0, densVelTextureID, 0, GL_TRUE, 0, GL_READ_WRITE, GL_RGBA32F);

        for (int i = 0; i < 15; i++) {

            glDispatchCompute(dimXZ / 8, dimY / 8, dimXZ / 8);
            glMemoryBarrier(GL_SHADER_IMAGE_ACCESS_BARRIER_BIT);

        }

        glUseProgram(advectShaderID);

        setUniform(advectShaderID, "dt", 0.01f);
        setUniform(advectShaderID, "u_inputImg", 0);
        setUniform(advectShaderID, "u_velocity", 0);
        setUniform(advectShaderID, "u_mask", glm::vec4(0.0f, 1.0f, 1.0f, 1.0f));

        glBindImageTexture(0, densVelTextureID, 0, GL_TRUE, 0, GL_READ_WRITE, GL_RGBA32F);

        glDispatchCompute(dimXZ / 8, dimY / 8, dimXZ / 8);
        glMemoryBarrier(GL_SHADER_IMAGE_ACCESS_BARRIER_BIT);

        setUniform(advectShaderID, "u_mask", glm::vec4(1.0f, 0.0f, 0.0f, 0.0f));

        glDispatchCompute(dimXZ / 8, dimY / 8, dimXZ / 8);
        glMemoryBarrier(GL_SHADER_IMAGE_ACCESS_BARRIER_BIT);

        glUseProgram(divShaderID);

        setUniform(divShaderID, "u_inputImg", 0);

        glActiveTexture(GL_TEXTURE0);
        glBindTexture(GL_TEXTURE_3D, densVelTextureID);

        glBindImageTexture(0, divergenceTextureID, 0, GL_TRUE, 0, GL_READ_WRITE, GL_RGBA32F);

        glDispatchCompute(dimXZ / 8, dimY / 8, dimXZ / 8);
        glMemoryBarrier(GL_SHADER_IMAGE_ACCESS_BARRIER_BIT);

        glBindImageTexture(0, 0, 0, GL_FALSE, 0, GL_READ_WRITE, GL_RGBA32F);
        glBindTexture(GL_TEXTURE_3D, 0);

        glUseProgram(0);

        // glUseProgram(shaderID);

        // setUniform(shaderID, "u_resolution", glm::vec3(dimXZ, dimY, dimXZ));
        // setUniform(shaderID, "u_targetSize", targetSize);
        // setUniform(shaderID, "u_targetOffset", targetOffest);
        // setUniform(shaderID, "u_time", (float)glfwGetTime());

        // glBindImageTexture(0, fluidTextureID, 0, GL_TRUE, 0, GL_WRITE_ONLY, GL_R32F);
        // glDispatchCompute(dimXZ / 8, dimY / 8, dimXZ / 8);
        // glMemoryBarrier(GL_SHADER_IMAGE_ACCESS_BARRIER_BIT);
        // glBindImageTexture(0, 0, 0, GL_FALSE, 0, GL_WRITE_ONLY, GL_R32F);
        // glBindTexture(GL_TEXTURE_3D, 0);

        // glUseProgram(0);
    }

    GLuint getTextureID() {
        return divergenceTextureID;
    }
};

#endif // voxeltexture.hpp