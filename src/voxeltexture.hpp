#ifndef VOXEL_TEXTURE_HPP
#define VOXEL_TEXTURE_HPP

#include "gl_includes.hpp"
#include "shader.hpp"

class VoxelTexture {
public:
    GLuint fieldTextureID{};
    GLuint velocityTextureID{};
    GLuint shaderID{};

    GLuint dimXZ{};
    GLuint dimY{};

public:
    VoxelTexture() {
        dimXZ = 128;
        dimY = 128;
    }

    void generateTexture(glm::vec3 targetSize, glm::vec3 targetOffest) {
        //std::cout << "Generating voxel texture..." << std::endl;

        if (shaderID) glDeleteProgram(shaderID);

        shaderID = glCreateProgram();

        loadShader(shaderID, GL_COMPUTE_SHADER, "../data/shaders/compute.glsl");

        glLinkProgram(shaderID);

        glUseProgram(shaderID);

        if (!fieldTextureID) {
            glGenTextures(1, &fieldTextureID);
        }
        if (!velocityTextureID) {
            glGenTextures(1, &velocityTextureID);
        }

        setUniform(shaderID, "u_resolution", glm::vec3(dimXZ, dimY, dimXZ));
        setUniform(shaderID, "u_targetSize", targetSize);
        setUniform(shaderID, "u_targetOffset", targetOffest);
        setUniform(shaderID, "u_time", (float)glfwGetTime());

        glBindTexture(GL_TEXTURE_3D, fieldTextureID);
        glTexParameteri(GL_TEXTURE_3D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
        glTexParameteri(GL_TEXTURE_3D, GL_TEXTURE_MIN_FILTER, GL_LINEAR);

        glTexImage3D(GL_TEXTURE_3D, 0, GL_R32F, dimXZ, dimY, dimXZ, 0, GL_RED, GL_FLOAT, nullptr);

        glBindTexture(GL_TEXTURE_3D, velocityTextureID);
        glTexParameteri(GL_TEXTURE_3D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
        glTexParameteri(GL_TEXTURE_3D, GL_TEXTURE_MIN_FILTER, GL_LINEAR);

        glTexImage3D(GL_TEXTURE_3D, 0, GL_R32F, dimXZ, dimY, dimXZ, 0, GL_RED, GL_FLOAT, nullptr);

        glBindImageTexture(0, fieldTextureID, 0, GL_TRUE, 0, GL_WRITE_ONLY, GL_R32F);
        glDispatchCompute(dimXZ / 8, dimY / 8, dimXZ / 8);
        glMemoryBarrier(GL_SHADER_IMAGE_ACCESS_BARRIER_BIT);
        glBindImageTexture(0, 0, 0, GL_FALSE, 0, GL_WRITE_ONLY, GL_R32F);
        glBindTexture(GL_TEXTURE_3D, 0);

        glUseProgram(0);
    }
};

#endif // voxeltexture.hpp