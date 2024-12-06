#ifndef VOXEL_TEXTURE_HPP
#define VOXEL_TEXTURE_HPP

#include "gl_includes.hpp"
#include "shader.hpp"

class VoxelTexture {
public:
    GLuint previousTextureID{};
    GLuint currentTextureID{};
    GLuint shaderID{};
    GLuint diffuseShaderID{};
    GLuint advectShaderID{};

    GLuint dimXZ{};
    GLuint dimY{};

    std::vector<float> data{};

public:
    VoxelTexture() {
        dimXZ = 128;
        dimY = 128;
    }
    ~VoxelTexture() {
        if (previousTextureID) glDeleteTextures(1, &previousTextureID);
        if (currentTextureID) glDeleteTextures(1, &currentTextureID);
        if (shaderID) glDeleteProgram(shaderID);
        if (diffuseShaderID) glDeleteProgram(diffuseShaderID);
        if (advectShaderID) glDeleteProgram(advectShaderID);
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
                }
            }
        }

    }

    void init_textures() {
        generate_data();

        if (shaderID) glDeleteProgram(shaderID);
        if (diffuseShaderID) glDeleteProgram(diffuseShaderID);

        shaderID = glCreateProgram();
        diffuseShaderID = glCreateProgram();
        advectShaderID = glCreateProgram();

        loadShader(shaderID, GL_COMPUTE_SHADER, "../data/shaders/compute.glsl");
        loadShader(diffuseShaderID, GL_COMPUTE_SHADER, "../data/shaders/compute/diffuse.glsl");
        loadShader(advectShaderID, GL_COMPUTE_SHADER, "../data/shaders/compute/advect.glsl");

        glLinkProgram(shaderID);
        glLinkProgram(diffuseShaderID);
        glLinkProgram(advectShaderID);

        if (!previousTextureID) {
            glGenTextures(1, &previousTextureID);
        }


        glBindTexture(GL_TEXTURE_3D, previousTextureID);

        float borderColor[] = { 0.0f, 0.0f, 0.0f, 0.0f };
        glTexParameterfv(GL_TEXTURE_3D, GL_TEXTURE_BORDER_COLOR, borderColor);

        glTexParameteri(GL_TEXTURE_3D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
        glTexParameteri(GL_TEXTURE_3D, GL_TEXTURE_MIN_FILTER, GL_LINEAR);
        glTexParameteri(GL_TEXTURE_3D, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_BORDER);
        glTexParameteri(GL_TEXTURE_3D, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_BORDER);

        glTexImage3D(GL_TEXTURE_3D, 0, GL_RGBA32F, dimXZ, dimY, dimXZ, 0, GL_RGBA, GL_FLOAT, data.data());

        if (!currentTextureID) {
            glGenTextures(1, &currentTextureID);
        }


        glBindTexture(GL_TEXTURE_3D, currentTextureID);

        glTexParameterfv(GL_TEXTURE_3D, GL_TEXTURE_BORDER_COLOR, borderColor);

        glTexParameteri(GL_TEXTURE_3D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
        glTexParameteri(GL_TEXTURE_3D, GL_TEXTURE_MIN_FILTER, GL_LINEAR);
        glTexParameteri(GL_TEXTURE_3D, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_BORDER);
        glTexParameteri(GL_TEXTURE_3D, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_BORDER);

        glTexImage3D(GL_TEXTURE_3D, 0, GL_RGBA32F, dimXZ, dimY, dimXZ, 0, GL_RGBA, GL_FLOAT, nullptr);

        swap = false;
    }

    bool swap = false;

    void simulationStep(glm::vec3 targetSize, glm::vec3 targetOffest, float dt) {
        //std::cout << "Generating voxel texture..." << std::endl;

        GLuint currentTextureID = swap ? previousTextureID : this->currentTextureID;
        GLuint previousTextureID = swap ? this->currentTextureID : this->previousTextureID;
        //swap = !swap;

        glUseProgram(diffuseShaderID);

        setUniform(diffuseShaderID, "dt", dt);
        setUniform(diffuseShaderID, "mu_density", 0.000f);
        setUniform(diffuseShaderID, "mu_velocity", 0.000f);
        setUniform(diffuseShaderID, "u_inputImg", 0);

        glActiveTexture(GL_TEXTURE0);
        glBindTexture(GL_TEXTURE_3D, previousTextureID);

        glBindImageTexture(0, previousTextureID, 0, GL_TRUE, 0, GL_READ_WRITE, GL_R32F);

        for (int i = 0; i < 15; i++) {

            glDispatchCompute(dimXZ / 8, dimY / 8, dimXZ / 8);
            glMemoryBarrier(GL_SHADER_IMAGE_ACCESS_BARRIER_BIT);

        }

        glUseProgram(advectShaderID);
        setUniform(advectShaderID, "dt", 0.01f);
        setUniform(advectShaderID, "u_inputImg", 0);
        setUniform(advectShaderID, "u_velocity", 0);

        glDispatchCompute(dimXZ / 8, dimY / 8, dimXZ / 8);
        glMemoryBarrier(GL_SHADER_IMAGE_ACCESS_BARRIER_BIT);


        glBindImageTexture(0, 0, 0, GL_FALSE, 0, GL_READ_WRITE, GL_R32F);
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
        return previousTextureID;
        // return swap ? previousTextureID : currentTextureID;
    }
};

#endif // voxeltexture.hpp